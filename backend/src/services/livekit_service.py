import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import aiohttp
from livekit import api
from ..config import settings
from ..models import CallSession, Participant, CallState, AgentRole

logger = logging.getLogger(__name__)


class LiveKitService:
    def __init__(self):
        self.api_key = settings.livekit_api_key
        self.api_secret = settings.livekit_api_secret
        self.url = settings.livekit_url
        self.session = None
        self.room_service = None
        self.active_sessions: Dict[str, CallSession] = {}
    
    async def _ensure_session(self):
        """Ensure aiohttp session is created"""
        if self.session is None:
            self.session = aiohttp.ClientSession()
            self.room_service = api.room_service.RoomService(
                self.session, self.url, self.api_key, self.api_secret
            )
        
    async def create_room(self, room_name: str, max_participants: int = 10) -> str:
        """Create a new LiveKit room"""
        await self._ensure_session()
        try:
            room_opts = api.CreateRoomRequest(
                name=room_name,
                empty_timeout=300,  # 5 minutes
                max_participants=max_participants,
                metadata=f"Created at {datetime.now().isoformat()}"
            )
            room = await self.room_service.create_room(room_opts)
            logger.info(f"Created room: {room.name} with SID: {room.sid}")
            return room.sid
        except Exception as e:
            logger.error(f"Failed to create room {room_name}: {e}")
            raise
    
    async def get_room_info(self, room_name: str) -> Optional[api.Room]:
        """Get room information"""
        await self._ensure_session()
        try:
            room = await self.room_service.list_rooms(api.ListRoomsRequest(names=[room_name]))
            return room.rooms[0] if room.rooms else None
        except Exception as e:
            logger.error(f"Failed to get room info for {room_name}: {e}")
            return None
    
    async def generate_access_token(
        self, 
        identity: str, 
        room_name: str, 
        is_agent: bool = False,
        can_publish: bool = True,
        can_subscribe: bool = True
    ) -> str:
        """Generate access token for participant"""
        token = api.AccessToken(self.api_key, self.api_secret, identity=identity)
        
        grants = api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=can_publish,
            can_subscribe=can_subscribe,
            can_publish_data=True,
            can_update_own_metadata=True
        )
        
        if is_agent:
            # Agents get additional permissions
            grants.can_publish_sources = ["camera", "microphone", "screen_share"]
            grants.hidden = False
            grants.recorder = True
        
        token.add_grant(grants)
        return token.to_jwt()
    
    async def create_call_session(
        self, 
        caller_identity: str, 
        agent_a_identity: str
    ) -> CallSession:
        """Create a new call session"""
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{caller_identity}"
        room_name = f"call_{session_id}"
        
        # Create the main call room
        room_sid = await self.create_room(room_name, max_participants=3)
        
        session = CallSession(
            session_id=session_id,
            caller_identity=caller_identity,
            agent_a_identity=agent_a_identity,
            original_room_sid=room_sid,
            state=CallState.WAITING,
            created_at=datetime.now(),
            participants=[]
        )
        
        self.active_sessions[session_id] = session
        logger.info(f"Created call session: {session_id}")
        return session
    
    async def join_participant(
        self, 
        session_id: str, 
        identity: str, 
        role: Optional[AgentRole] = None
    ) -> str:
        """Add participant to call session and return access token"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.active_sessions[session_id]
        room_name = f"call_{session_id}"
        
        is_agent = role is not None
        
        # Generate access token
        token = await self.generate_access_token(
            identity=identity,
            room_name=room_name,
            is_agent=is_agent
        )
        
        # Add participant to session
        participant = Participant(
            identity=identity,
            name=identity,
            role=role,
            is_agent=is_agent,
            joined_at=datetime.now(),
            room_sid=session.original_room_sid
        )
        
        session.participants.append(participant)
        
        # Update session state
        if role == AgentRole.AGENT_A and session.state == CallState.WAITING:
            session.state = CallState.CONNECTED
        
        logger.info(f"Participant {identity} joined session {session_id}")
        return token
    
    async def initiate_warm_transfer(
        self, 
        session_id: str, 
        agent_b_identity: str,
        transfer_reason: Optional[str] = None
    ) -> str:
        """Initiate warm transfer by creating transfer room"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.active_sessions[session_id]
        session.agent_b_identity = agent_b_identity
        session.transfer_reason = transfer_reason
        session.state = CallState.TRANSFERRING
        
        # Create transfer room for Agent A and Agent B
        transfer_room_name = f"transfer_{session_id}_{datetime.now().strftime('%H%M%S')}"
        transfer_room_sid = await self.create_room(transfer_room_name, max_participants=2)
        session.transfer_room_sid = transfer_room_sid
        
        logger.info(f"Initiated warm transfer for session {session_id}")
        return transfer_room_sid
    
    async def get_transfer_room_tokens(self, session_id: str) -> Dict[str, str]:
        """Get access tokens for transfer room"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.active_sessions[session_id]
        if not session.transfer_room_sid:
            raise ValueError(f"No transfer room for session {session_id}")
        
        transfer_room_name = f"transfer_{session_id}_{session.transfer_room_sid[-6:]}"
        
        tokens = {}
        
        # Agent A token
        if session.agent_a_identity:
            tokens["agent_a"] = await self.generate_access_token(
                identity=session.agent_a_identity,
                room_name=transfer_room_name,
                is_agent=True
            )
        
        # Agent B token
        if session.agent_b_identity:
            tokens["agent_b"] = await self.generate_access_token(
                identity=session.agent_b_identity,
                room_name=transfer_room_name,
                is_agent=True
            )
        
        return tokens
    
    async def complete_transfer(self, session_id: str) -> str:
        """Complete transfer by moving caller to transfer room with Agent B"""
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.active_sessions[session_id]
        if not session.agent_b_identity:
            raise ValueError(f"No Agent B assigned for session {session_id}")
        
        # Generate token for caller to join the new room with Agent B
        final_room_name = f"final_{session_id}"
        final_room_sid = await self.create_room(final_room_name, max_participants=2)
        
        caller_token = await self.generate_access_token(
            identity=session.caller_identity,
            room_name=final_room_name,
            is_agent=False
        )
        
        agent_b_token = await self.generate_access_token(
            identity=session.agent_b_identity,
            room_name=final_room_name,
            is_agent=True
        )
        
        session.state = CallState.TRANSFERRED
        
        logger.info(f"Completed transfer for session {session_id}")
        return final_room_sid
    
    async def end_session(self, session_id: str):
        """End call session and cleanup resources"""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            session.state = CallState.ENDED
            
            # Could add room cleanup logic here
            logger.info(f"Ended session {session_id}")
            
    async def get_session(self, session_id: str) -> Optional[CallSession]:
        """Get call session by ID"""
        return self.active_sessions.get(session_id)
    
    async def list_active_sessions(self) -> List[CallSession]:
        """List all active sessions"""
        return list(self.active_sessions.values())
    
    async def remove_participant_from_room(self, room_name: str, identity: str):
        """Remove participant from room"""
        await self._ensure_session()
        try:
            await self.room_service.remove_participant(
                api.RoomParticipantIdentity(room=room_name, identity=identity)
            )
            logger.info(f"Removed participant {identity} from room {room_name}")
        except Exception as e:
            logger.error(f"Failed to remove participant {identity} from {room_name}: {e}")
    
    async def cleanup(self):
        """Clean up resources"""
        if self.session:
            await self.session.close()
            self.session = None
            self.room_service = None


# Global instance
livekit_service = LiveKitService()