import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LiveKit Configuration
    livekit_url: str = "wss://localhost:7880"
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    
    # LLM Provider Configuration
    llm_provider: str = "openai"  # openai, groq, openrouter
    openai_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    
    # Twilio Configuration (Optional)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    
    # Server Configuration
    host: str = "localhost"
    port: int = 8000
    debug: bool = True
    
    class Config:
        env_file = ".env"


settings = Settings()