import asyncio
import logging
from typing import Optional, Dict, Any
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Dial
from ..config import settings
from ..models import TwilioCallRequest

logger = logging.getLogger(__name__)


class TwilioService:
    def __init__(self):
        self.client = None
        self.phone_number = settings.twilio_phone_number
        if settings.twilio_account_sid and settings.twilio_auth_token:
            self.client = Client(
                settings.twilio_account_sid, 
                settings.twilio_auth_token
            )
            logger.info("Twilio client initialized")
        else:
            logger.warning("Twilio credentials not configured")
    
    def is_available(self) -> bool:
        """Check if Twilio service is available"""
        return self.client is not None
    
    async def initiate_call(self, call_request: TwilioCallRequest) -> Optional[str]:
        """Initiate outbound call to phone number"""
        if not self.is_available():
            logger.error("Twilio service not available")
            return None
        
        try:
            # Create TwiML for the call
            twiml_url = f"http://your-domain.com/api/twilio/connect/{call_request.session_id}"
            
            call = self.client.calls.create(
                to=call_request.phone_number,
                from_=self.phone_number,
                url=twiml_url,
                method='POST'
            )
            
            logger.info(f"Initiated Twilio call to {call_request.phone_number}, SID: {call.sid}")
            return call.sid
            
        except Exception as e:
            logger.error(f"Failed to initiate Twilio call: {e}")
            return None
    
    def generate_connect_twiml(
        self, 
        session_id: str, 
        agent_identity: str,
        explanation_text: Optional[str] = None
    ) -> str:
        """Generate TwiML to connect call to LiveKit"""
        response = VoiceResponse()
        
        if explanation_text:
            # Say the explanation first
            response.say(explanation_text, voice='alice')
        
        # Connect to LiveKit room via SIP
        dial = Dial()
        
        # This would typically connect to a LiveKit SIP endpoint
        # For demo purposes, we'll create a conference bridge
        dial.conference(
            f"livekit-{session_id}",
            start_conference_on_enter=True,
            end_conference_on_exit=False
        )
        
        response.append(dial)
        return str(response)
    
    def generate_transfer_twiml(
        self, 
        target_number: str,
        explanation_text: Optional[str] = None
    ) -> str:
        """Generate TwiML for warm transfer to another number"""
        response = VoiceResponse()
        
        if explanation_text:
            response.say(explanation_text, voice='alice')
        
        # Transfer the call
        dial = Dial()
        dial.number(target_number)
        response.append(dial)
        
        return str(response)
    
    async def transfer_call(
        self, 
        call_sid: str, 
        target_number: str,
        explanation_text: Optional[str] = None
    ) -> bool:
        """Transfer existing call to target number"""
        if not self.is_available():
            return False
        
        try:
            twiml = self.generate_transfer_twiml(target_number, explanation_text)
            
            # Update the call with new TwiML
            call = self.client.calls(call_sid).update(
                twiml=twiml
            )
            
            logger.info(f"Transferred call {call_sid} to {target_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to transfer call {call_sid}: {e}")
            return False
    
    async def end_call(self, call_sid: str) -> bool:
        """End an active call"""
        if not self.is_available():
            return False
        
        try:
            call = self.client.calls(call_sid).update(status='completed')
            logger.info(f"Ended call {call_sid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to end call {call_sid}: {e}")
            return False
    
    def generate_webhook_response(
        self, 
        action: str, 
        session_id: Optional[str] = None,
        explanation_text: Optional[str] = None,
        target_number: Optional[str] = None
    ) -> str:
        """Generate TwiML response for webhook events"""
        response = VoiceResponse()
        
        if action == "connect_to_livekit":
            if explanation_text:
                response.say(explanation_text, voice='alice')
            
            dial = Dial()
            dial.conference(
                f"livekit-{session_id}",
                start_conference_on_enter=True
            )
            response.append(dial)
            
        elif action == "transfer":
            if explanation_text:
                response.say(explanation_text, voice='alice')
            
            if target_number:
                dial = Dial()
                dial.number(target_number)
                response.append(dial)
            
        elif action == "hangup":
            if explanation_text:
                response.say(explanation_text, voice='alice')
            response.hangup()
            
        else:
            response.say("Thank you for calling.", voice='alice')
            response.hangup()
        
        return str(response)


# Global instance
twilio_service = TwilioService()