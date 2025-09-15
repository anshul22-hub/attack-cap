import asyncio
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime
from abc import ABC, abstractmethod
from enum import Enum
from ..models import AgentRole, CallSession, CallState
from ..services import livekit_service, llm_service

logger = logging.getLogger(__name__)


class AgentState(Enum):
    IDLE = "idle"
    IN_CALL = "in_call"
    IN_TRANSFER = "in_transfer"
    OFFLINE = "offline"


class BaseAgent(ABC):
    """Base class for all agents"""
    
    def __init__(self, identity: str, name: str, role: AgentRole):
        self.identity = identity
        self.name = name
        self.role = role
        self.state = AgentState.IDLE
        self.current_session_id: Optional[str] = None
        self.conversation_history: List[Dict[str, str]] = []
        
    @abstractmethod
    async def handle_incoming_call(self, session_id: str) -> bool:
        """Handle incoming call connection"""
        pass
    
    @abstractmethod
    async def process_conversation(self, message: str, speaker: str) -> Optional[str]:
        """Process conversation and generate response"""
        pass
    
    async def add_to_conversation(self, speaker: str, content: str):
        """Add message to conversation history"""
        self.conversation_history.append({
            "speaker": speaker,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
    
    async def generate_call_summary(self) -> Optional[str]:
        """Generate summary of current conversation"""
        if not self.conversation_history:
            return None
        
        try:
            response = await llm_service.generate_call_summary(self.conversation_history)
            return response.content
        except Exception as e:
            logger.error(f"Failed to generate call summary for {self.identity}: {e}")
            return None
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            "identity": self.identity,
            "name": self.name,
            "role": self.role.value,
            "state": self.state.value,
            "current_session": self.current_session_id,
            "conversation_length": len(self.conversation_history)
        }


class AgentA(BaseAgent):
    """Agent A - Initial call handler and transfer initiator"""
    
    def __init__(self, identity: str, name: str = "Agent A"):
        super().__init__(identity, name, AgentRole.AGENT_A)
        self.transfer_requests: Dict[str, Dict] = {}
    
    async def handle_incoming_call(self, session_id: str) -> bool:
        """Handle incoming call from customer"""
        try:
            self.state = AgentState.IN_CALL
            self.current_session_id = session_id
            self.conversation_history = []
            
            # Add greeting to conversation
            greeting = "Hello! This is Agent A. How can I help you today?"
            await self.add_to_conversation("Agent A", greeting)
            
            logger.info(f"Agent A {self.identity} handling call {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Agent A failed to handle incoming call {session_id}: {e}")
            return False
    
    async def process_conversation(self, message: str, speaker: str) -> Optional[str]:
        """Process customer message and generate response"""
        await self.add_to_conversation(speaker, message)
        
        # Simple response logic - in real implementation, this would be more sophisticated
        if "billing" in message.lower() or "payment" in message.lower():
            response = "I can see this is related to billing. Let me transfer you to our billing specialist who can help you better."
            await self.add_to_conversation("Agent A", response)
            return response
        elif "technical" in message.lower() or "not working" in message.lower():
            response = "This sounds like a technical issue. I'll connect you with our technical support team."
            await self.add_to_conversation("Agent A", response)
            return response
        else:
            response = "I understand. Let me see how I can help you with that."
            await self.add_to_conversation("Agent A", response)
            return response
    
    async def initiate_transfer(
        self, 
        agent_b_identity: str, 
        reason: str = "Specialized assistance required"
    ) -> Optional[str]:
        """Initiate warm transfer to Agent B"""
        if not self.current_session_id:
            logger.error("No active session for transfer")
            return None
        
        try:
            self.state = AgentState.IN_TRANSFER
            
            # Generate call summary
            call_summary = await self.generate_call_summary()
            if not call_summary:
                call_summary = "Customer inquiry requiring specialized assistance"
            
            # Initiate transfer in LiveKit
            transfer_room_sid = await livekit_service.initiate_warm_transfer(
                self.current_session_id,
                agent_b_identity,
                reason
            )
            
            # Store transfer details
            self.transfer_requests[self.current_session_id] = {
                "agent_b_identity": agent_b_identity,
                "reason": reason,
                "call_summary": call_summary,
                "transfer_room_sid": transfer_room_sid,
                "initiated_at": datetime.now().isoformat()
            }
            
            logger.info(f"Agent A initiated transfer to {agent_b_identity} for session {self.current_session_id}")
            return transfer_room_sid
            
        except Exception as e:
            logger.error(f"Failed to initiate transfer: {e}")
            self.state = AgentState.IN_CALL
            return None
    
    async def explain_transfer_to_agent_b(self, agent_b_identity: str) -> Optional[str]:
        """Generate and provide explanation to Agent B"""
        if self.current_session_id not in self.transfer_requests:
            logger.error("No transfer request found")
            return None
        
        transfer_info = self.transfer_requests[self.current_session_id]
        
        try:
            # Generate explanation using LLM
            explanation_response = await llm_service.generate_transfer_explanation(
                transfer_info["call_summary"],
                transfer_info["reason"],
                f"Agent B ({agent_b_identity})"
            )
            
            explanation = explanation_response.content
            
            # Add to conversation history
            await self.add_to_conversation(
                "Agent A", 
                f"[Transfer explanation to {agent_b_identity}]: {explanation}"
            )
            
            logger.info(f"Agent A provided explanation to Agent B {agent_b_identity}")
            return explanation
            
        except Exception as e:
            logger.error(f"Failed to generate transfer explanation: {e}")
            return None
    
    async def complete_transfer(self) -> bool:
        """Complete transfer and exit call"""
        if not self.current_session_id:
            return False
        
        try:
            # Update session state
            session = await livekit_service.get_session(self.current_session_id)
            if session:
                session.call_summary = await self.generate_call_summary()
            
            # Agent A leaves the call
            self.state = AgentState.IDLE
            previous_session = self.current_session_id
            self.current_session_id = None
            
            logger.info(f"Agent A completed transfer for session {previous_session}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to complete transfer: {e}")
            return False


class AgentB(BaseAgent):
    """Agent B - Specialist agent receiving transfers"""
    
    def __init__(self, identity: str, name: str = "Agent B", specialty: str = "General Support"):
        super().__init__(identity, name, AgentRole.AGENT_B)
        self.specialty = specialty
        self.transfer_context: Optional[Dict] = None
    
    async def handle_incoming_call(self, session_id: str) -> bool:
        """Handle incoming transfer from Agent A"""
        try:
            self.state = AgentState.IN_CALL
            self.current_session_id = session_id
            
            logger.info(f"Agent B {self.identity} receiving transfer for session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Agent B failed to handle transfer {session_id}: {e}")
            return False
    
    async def receive_transfer_context(self, explanation: str, call_summary: str):
        """Receive transfer context from Agent A"""
        self.transfer_context = {
            "explanation": explanation,
            "call_summary": call_summary,
            "received_at": datetime.now().isoformat()
        }
        
        # Add to conversation history
        await self.add_to_conversation("Agent A", f"[Transfer]: {explanation}")
        
        # Agent B acknowledges
        acknowledgment = f"Thank you Agent A. I'll take care of this customer. Hello, I'm {self.name} from {self.specialty}. I've been briefed on your situation and I'm here to help."
        await self.add_to_conversation("Agent B", acknowledgment)
        
        logger.info(f"Agent B {self.identity} received transfer context")
    
    async def process_conversation(self, message: str, speaker: str) -> Optional[str]:
        """Process customer message after transfer"""
        await self.add_to_conversation(speaker, message)
        
        # Agent B responses based on specialty
        if self.specialty == "Billing":
            if "payment" in message.lower() or "billing" in message.lower():
                response = "I can help you with that billing issue. Let me pull up your account details."
            else:
                response = "I'm here to help with any billing or payment related questions you might have."
        elif self.specialty == "Technical":
            if "not working" in message.lower() or "broken" in message.lower():
                response = "I understand the technical issue you're experiencing. Let me troubleshoot this with you."
            else:
                response = "I'm here to provide technical support and resolve any technical issues."
        else:
            response = "I'm here to provide specialized assistance. How can I help you today?"
        
        await self.add_to_conversation("Agent B", response)
        return response
    
    async def end_call(self) -> bool:
        """End call with customer"""
        try:
            if self.current_session_id:
                # Generate final summary
                final_summary = await self.generate_call_summary()
                
                # Update session
                await livekit_service.end_session(self.current_session_id)
                
                # Reset agent state
                self.state = AgentState.IDLE
                self.current_session_id = None
                self.transfer_context = None
                
                logger.info(f"Agent B {self.identity} ended call")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to end call: {e}")
            return False


class AgentManager:
    """Manages all agents and their states"""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.agent_assignments: Dict[str, str] = {}  # session_id -> agent_identity
    
    def register_agent(self, agent: BaseAgent):
        """Register a new agent"""
        self.agents[agent.identity] = agent
        logger.info(f"Registered agent: {agent.identity} ({agent.role.value})")
    
    def get_agent(self, identity: str) -> Optional[BaseAgent]:
        """Get agent by identity"""
        return self.agents.get(identity)
    
    def get_available_agent_a(self) -> Optional[AgentA]:
        """Get available Agent A"""
        for agent in self.agents.values():
            if (isinstance(agent, AgentA) and 
                agent.state == AgentState.IDLE):
                return agent
        return None
    
    def get_available_agent_b(self, specialty: Optional[str] = None) -> Optional[AgentB]:
        """Get available Agent B, optionally filtered by specialty"""
        for agent in self.agents.values():
            if (isinstance(agent, AgentB) and 
                agent.state == AgentState.IDLE):
                if specialty is None or agent.specialty == specialty:
                    return agent
        return None
    
    def assign_agent_to_session(self, session_id: str, agent_identity: str):
        """Assign agent to session"""
        self.agent_assignments[session_id] = agent_identity
    
    def get_session_agent(self, session_id: str) -> Optional[BaseAgent]:
        """Get agent assigned to session"""
        agent_identity = self.agent_assignments.get(session_id)
        if agent_identity:
            return self.agents.get(agent_identity)
        return None
    
    def list_agents(self) -> List[Dict[str, Any]]:
        """List all agents and their status"""
        return [agent.get_status() for agent in self.agents.values()]
    
    async def create_default_agents(self):
        """Create default agents for demo"""
        # Create Agent A
        agent_a = AgentA("agent_a_001", "Sarah (Agent A)")
        self.register_agent(agent_a)
        
        # Create Agent B instances
        agent_b_billing = AgentB("agent_b_billing", "Mike (Billing)", "Billing")
        agent_b_tech = AgentB("agent_b_technical", "Lisa (Technical)", "Technical")
        agent_b_general = AgentB("agent_b_general", "John (General)", "General Support")
        
        self.register_agent(agent_b_billing)
        self.register_agent(agent_b_tech)
        self.register_agent(agent_b_general)
        
        logger.info("Created default agents")


# Global instance
agent_manager = AgentManager()