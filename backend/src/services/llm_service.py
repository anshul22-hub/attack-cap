import asyncio
import logging
import time
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
import httpx
from openai import AsyncOpenAI
from groq import AsyncGroq
from ..config import settings
from ..models import LLMResponse

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers"""
    
    @abstractmethod
    async def generate_call_summary(
        self, 
        conversation_history: List[Dict[str, str]], 
        context: Optional[Dict[str, Any]] = None
    ) -> LLMResponse:
        """Generate a call summary from conversation history"""
        pass
    
    @abstractmethod
    async def generate_transfer_explanation(
        self, 
        call_summary: str, 
        transfer_reason: str,
        agent_b_context: Optional[str] = None
    ) -> LLMResponse:
        """Generate explanation for Agent B during warm transfer"""
        pass


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = "gpt-3.5-turbo"
    
    async def generate_call_summary(
        self, 
        conversation_history: List[Dict[str, str]], 
        context: Optional[Dict[str, Any]] = None
    ) -> LLMResponse:
        start_time = time.time()
        
        # Create conversation summary prompt
        conversation_text = "\n".join([
            f"{msg['speaker']}: {msg['content']}" 
            for msg in conversation_history
        ])
        
        context_text = ""
        if context:
            context_text = f"\nAdditional context: {context}"
        
        prompt = f"""
        Please create a concise call summary based on the following conversation:
        
        {conversation_text}
        {context_text}
        
        Provide a summary that includes:
        1. Main topics discussed
        2. Customer's primary concern or request
        3. Actions taken or promised
        4. Current status
        5. Any important details for handoff
        
        Keep it professional and under 200 words.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional call center supervisor creating handoff summaries."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.3
            )
            
            processing_time = time.time() - start_time
            
            return LLMResponse(
                content=response.choices[0].message.content.strip(),
                model=self.model,
                tokens_used=response.usage.total_tokens,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def generate_transfer_explanation(
        self, 
        call_summary: str, 
        transfer_reason: str,
        agent_b_context: Optional[str] = None
    ) -> LLMResponse:
        start_time = time.time()
        
        context_text = ""
        if agent_b_context:
            context_text = f"\nAgent B specializes in: {agent_b_context}"
        
        prompt = f"""
        You are Agent A explaining a call transfer to Agent B. Create a brief, professional explanation.
        
        Call Summary: {call_summary}
        
        Transfer Reason: {transfer_reason}
        {context_text}
        
        Provide a clear, conversational explanation (under 100 words) that Agent A would speak to Agent B, including:
        1. Quick introduction
        2. Why you're transferring
        3. Key points Agent B needs to know
        4. Any urgent items
        
        Make it sound natural and professional.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional agent making a warm transfer handoff."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.4
            )
            
            processing_time = time.time() - start_time
            
            return LLMResponse(
                content=response.choices[0].message.content.strip(),
                model=self.model,
                tokens_used=response.usage.total_tokens,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise


class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.client = AsyncGroq(api_key=api_key)
        self.model = "llama-3.1-8b-instant"
    
    async def generate_call_summary(
        self, 
        conversation_history: List[Dict[str, str]], 
        context: Optional[Dict[str, Any]] = None
    ) -> LLMResponse:
        start_time = time.time()
        
        conversation_text = "\n".join([
            f"{msg['speaker']}: {msg['content']}" 
            for msg in conversation_history
        ])
        
        context_text = ""
        if context:
            context_text = f"\nAdditional context: {context}"
        
        prompt = f"""
        Create a professional call summary for agent handoff:
        
        Conversation:
        {conversation_text}
        {context_text}
        
        Summary should include:
        - Customer's main issue
        - Key discussion points
        - Current status
        - Next steps needed
        
        Keep under 200 words, professional tone.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a call center supervisor creating handoff summaries."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.3
            )
            
            processing_time = time.time() - start_time
            
            return LLMResponse(
                content=response.choices[0].message.content.strip(),
                model=self.model,
                tokens_used=response.usage.total_tokens if hasattr(response, 'usage') else None,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise
    
    async def generate_transfer_explanation(
        self, 
        call_summary: str, 
        transfer_reason: str,
        agent_b_context: Optional[str] = None
    ) -> LLMResponse:
        start_time = time.time()
        
        context_text = ""
        if agent_b_context:
            context_text = f"\nAgent B specialty: {agent_b_context}"
        
        prompt = f"""
        Agent A speaking to Agent B during warm transfer:
        
        Call Summary: {call_summary}
        Transfer Reason: {transfer_reason}
        {context_text}
        
        Create natural spoken explanation (under 100 words) covering:
        - Brief greeting
        - Transfer reason
        - Key customer details
        - Any urgent items
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an agent making a professional warm transfer."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.4
            )
            
            processing_time = time.time() - start_time
            
            return LLMResponse(
                content=response.choices[0].message.content.strip(),
                model=self.model,
                tokens_used=response.usage.total_tokens if hasattr(response, 'usage') else None,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise


class OpenRouterProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "meta-llama/llama-3.1-8b-instruct:free"
    
    async def _make_request(self, messages: List[Dict], max_tokens: int = 300, temperature: float = 0.3) -> Dict:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/warm-transfer-livekit",
            "X-Title": "Warm Transfer LiveKit Application"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def generate_call_summary(
        self, 
        conversation_history: List[Dict[str, str]], 
        context: Optional[Dict[str, Any]] = None
    ) -> LLMResponse:
        start_time = time.time()
        
        conversation_text = "\n".join([
            f"{msg['speaker']}: {msg['content']}" 
            for msg in conversation_history
        ])
        
        context_text = ""
        if context:
            context_text = f"\nContext: {context}"
        
        prompt = f"""
        Create call summary for agent handoff:
        
        {conversation_text}
        {context_text}
        
        Include: customer issue, key points, status, next steps.
        Keep under 200 words.
        """
        
        try:
            messages = [
                {"role": "system", "content": "You create professional call summaries for agent handoffs."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self._make_request(messages, max_tokens=300, temperature=0.3)
            processing_time = time.time() - start_time
            
            return LLMResponse(
                content=response["choices"][0]["message"]["content"].strip(),
                model=self.model,
                tokens_used=response.get("usage", {}).get("total_tokens"),
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            raise
    
    async def generate_transfer_explanation(
        self, 
        call_summary: str, 
        transfer_reason: str,
        agent_b_context: Optional[str] = None
    ) -> LLMResponse:
        start_time = time.time()
        
        context_text = ""
        if agent_b_context:
            context_text = f"\nAgent B handles: {agent_b_context}"
        
        prompt = f"""
        Agent A transferring call to Agent B.
        
        Summary: {call_summary}
        Reason: {transfer_reason}
        {context_text}
        
        Create brief spoken explanation (under 100 words) with greeting, reason, key details.
        """
        
        try:
            messages = [
                {"role": "system", "content": "You are an agent making a warm transfer handoff."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self._make_request(messages, max_tokens=150, temperature=0.4)
            processing_time = time.time() - start_time
            
            return LLMResponse(
                content=response["choices"][0]["message"]["content"].strip(),
                model=self.model,
                tokens_used=response.get("usage", {}).get("total_tokens"),
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            raise


class LLMService:
    def __init__(self):
        self.provider = self._initialize_provider()
    
    def _initialize_provider(self) -> BaseLLMProvider:
        """Initialize the LLM provider based on configuration"""
        provider_name = settings.llm_provider.lower()
        
        if provider_name == "openai" and settings.openai_api_key:
            return OpenAIProvider(settings.openai_api_key)
        elif provider_name == "groq" and settings.groq_api_key:
            return GroqProvider(settings.groq_api_key)
        elif provider_name == "openrouter" and settings.openrouter_api_key:
            return OpenRouterProvider(settings.openrouter_api_key)
        else:
            raise ValueError(f"No valid LLM provider configured. Provider: {provider_name}")
    
    async def generate_call_summary(
        self, 
        conversation_history: List[Dict[str, str]], 
        context: Optional[Dict[str, Any]] = None
    ) -> LLMResponse:
        """Generate call summary using the configured provider"""
        return await self.provider.generate_call_summary(conversation_history, context)
    
    async def generate_transfer_explanation(
        self, 
        call_summary: str, 
        transfer_reason: str,
        agent_b_context: Optional[str] = None
    ) -> LLMResponse:
        """Generate transfer explanation using the configured provider"""
        return await self.provider.generate_transfer_explanation(
            call_summary, transfer_reason, agent_b_context
        )
    
    async def create_mock_conversation_summary(self, session_id: str) -> str:
        """Create a mock conversation summary for demo purposes"""
        mock_conversation = [
            {"speaker": "Caller", "content": "Hi, I'm having trouble with my account login"},
            {"speaker": "Agent A", "content": "I'd be happy to help you with that. Can you provide your email address?"},
            {"speaker": "Caller", "content": "Sure, it's john.doe@email.com"},
            {"speaker": "Agent A", "content": "I can see your account. It looks like there might be a billing issue that's causing the login problem."},
            {"speaker": "Caller", "content": "Oh, I did have a payment decline recently"},
            {"speaker": "Agent A", "content": "Let me transfer you to our billing specialist who can help resolve this quickly."}
        ]
        
        context = {
            "session_id": session_id,
            "account_email": "john.doe@email.com",
            "issue_type": "login_billing"
        }
        
        summary_response = await self.generate_call_summary(mock_conversation, context)
        return summary_response.content


# Global instance
llm_service = LLMService()