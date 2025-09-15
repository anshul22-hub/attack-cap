import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from typing import Dict, List, Optional
import json

from .config import settings
from .models import (
    CallSession, TransferRequest, TwilioCallRequest, 
    CallState, AgentRole
)
from .services import livekit_service, llm_service, twilio_service
from .agents import agent_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Warm Transfer Application...")
    
    # Initialize default agents
    await agent_manager.create_default_agents()
    
    logger.info("Application started successfully")
    yield
    
    # Shutdown
    logger.info("Shutting down application...")


app = FastAPI(
    title="Warm Transfer LiveKit Application",
    description="LiveKit-based warm call transfer system with LLM integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connections for real-time updates
connected_clients: Dict[str, WebSocket] = {}


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Warm Transfer LiveKit Application API"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "livekit_configured": bool(settings.livekit_api_key),
        "llm_configured": bool(
            settings.openai_api_key or 
            settings.groq_api_key or 
            settings.openrouter_api_key
        ),
        "twilio_available": twilio_service.is_available()
    }


# === Call Management Endpoints ===

@app.post("/api/calls/create")
async def create_call(caller_identity: str, agent_a_identity: Optional[str] = None):
    """Create a new call session"""
    try:
        # Get available Agent A if not specified
        if not agent_a_identity:
            agent_a = agent_manager.get_available_agent_a()
            if not agent_a:
                raise HTTPException(status_code=503, detail="No Agent A available")
            agent_a_identity = agent_a.identity
        
        # Create call session
        session = await livekit_service.create_call_session(
            caller_identity, 
            agent_a_identity
        )
        
        # Assign agent to session
        agent_manager.assign_agent_to_session(session.session_id, agent_a_identity)
        
        # Get Agent A and handle incoming call
        agent_a = agent_manager.get_agent(agent_a_identity)
        if agent_a:
            await agent_a.handle_incoming_call(session.session_id)
        
        return {
            "session_id": session.session_id,
            "room_name": f"call_{session.session_id}",
            "agent_a_identity": agent_a_identity
        }
        
    except Exception as e:
        logger.error(f"Failed to create call: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/calls/{session_id}/join")
async def join_call(session_id: str, identity: str, role: Optional[str] = None):
    """Join a call session"""
    try:
        agent_role = AgentRole(role) if role else None
        
        token = await livekit_service.join_participant(
            session_id, 
            identity, 
            agent_role
        )
        
        return {
            "access_token": token,
            "livekit_url": settings.livekit_url,
            "room_name": f"call_{session_id}"
        }
        
    except Exception as e:
        logger.error(f"Failed to join call {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/calls/{session_id}/transfer")
async def initiate_transfer(session_id: str, transfer_request: TransferRequest):
    """Initiate warm transfer"""
    try:
        # Get Agent A
        agent_a = agent_manager.get_agent(transfer_request.agent_a_identity)
        if not agent_a:
            raise HTTPException(status_code=404, detail="Agent A not found")
        
        # Get Agent B
        agent_b = agent_manager.get_agent(transfer_request.agent_b_identity)
        if not agent_b:
            # Try to get available Agent B
            agent_b = agent_manager.get_available_agent_b()
            if not agent_b:
                raise HTTPException(status_code=503, detail="No Agent B available")
            transfer_request.agent_b_identity = agent_b.identity
        
        # Initiate transfer
        transfer_room_sid = await agent_a.initiate_transfer(
            transfer_request.agent_b_identity,
            transfer_request.reason or "Customer transfer request"
        )
        
        if not transfer_room_sid:
            raise HTTPException(status_code=500, detail="Failed to initiate transfer")
        
        # Get transfer room tokens
        tokens = await livekit_service.get_transfer_room_tokens(session_id)
        
        return {
            "transfer_room_sid": transfer_room_sid,
            "tokens": tokens,
            "agent_b_identity": transfer_request.agent_b_identity
        }
        
    except Exception as e:
        logger.error(f"Failed to initiate transfer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/calls/{session_id}/explain")
async def explain_transfer(session_id: str, agent_a_identity: str, agent_b_identity: str):
    """Generate and provide transfer explanation to Agent B"""
    try:
        agent_a = agent_manager.get_agent(agent_a_identity)
        agent_b = agent_manager.get_agent(agent_b_identity)
        
        if not agent_a or not agent_b:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Generate explanation
        explanation = await agent_a.explain_transfer_to_agent_b(agent_b_identity)
        if not explanation:
            raise HTTPException(status_code=500, detail="Failed to generate explanation")
        
        # Get call summary for Agent B
        call_summary = await agent_a.generate_call_summary()
        
        # Agent B receives context
        await agent_b.receive_transfer_context(explanation, call_summary or "")
        
        return {
            "explanation": explanation,
            "call_summary": call_summary
        }
        
    except Exception as e:
        logger.error(f"Failed to explain transfer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/calls/{session_id}/complete")
async def complete_transfer(session_id: str, agent_a_identity: str):
    """Complete transfer and Agent A exits"""
    try:
        agent_a = agent_manager.get_agent(agent_a_identity)
        if not agent_a:
            raise HTTPException(status_code=404, detail="Agent A not found")
        
        # Complete transfer
        success = await agent_a.complete_transfer()
        if not success:
            raise HTTPException(status_code=500, detail="Failed to complete transfer")
        
        # Create final room for caller and Agent B
        final_room_sid = await livekit_service.complete_transfer(session_id)
        
        return {
            "success": True,
            "final_room_sid": final_room_sid,
            "message": "Transfer completed successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to complete transfer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/calls/{session_id}")
async def get_call_info(session_id: str):
    """Get call session information"""
    try:
        session = await livekit_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return session.dict()
        
    except Exception as e:
        logger.error(f"Failed to get call info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# === Agent Management Endpoints ===

@app.get("/api/agents")
async def list_agents():
    """List all agents and their status"""
    return agent_manager.list_agents()


@app.get("/api/agents/{identity}")
async def get_agent_status(identity: str):
    """Get specific agent status"""
    agent = agent_manager.get_agent(identity)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return agent.get_status()


# === Twilio Integration Endpoints ===

@app.post("/api/twilio/call")
async def initiate_twilio_call(call_request: TwilioCallRequest):
    """Initiate outbound call via Twilio"""
    if not twilio_service.is_available():
        raise HTTPException(status_code=503, detail="Twilio service not available")
    
    try:
        call_sid = await twilio_service.initiate_call(call_request)
        if not call_sid:
            raise HTTPException(status_code=500, detail="Failed to initiate call")
        
        return {
            "call_sid": call_sid,
            "phone_number": call_request.phone_number,
            "session_id": call_request.session_id
        }
        
    except Exception as e:
        logger.error(f"Failed to initiate Twilio call: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/twilio/webhook/{session_id}")
async def twilio_webhook(session_id: str, action: str = "connect_to_livekit"):
    """Twilio webhook handler"""
    try:
        # Get session info
        session = await livekit_service.get_session(session_id)
        if not session:
            return JSONResponse(
                content=twilio_service.generate_webhook_response("hangup"),
                media_type="application/xml"
            )
        
        # Generate appropriate TwiML response
        if action == "connect_to_livekit":
            # Generate explanation text if available
            explanation_text = None
            if session.agent_a_identity:
                agent_a = agent_manager.get_agent(session.agent_a_identity)
                if agent_a and hasattr(agent_a, 'current_session_id'):
                    explanation_text = await agent_a.explain_transfer_to_agent_b("phone_agent")
        
        twiml = twilio_service.generate_webhook_response(
            action, 
            session_id,
            explanation_text
        )
        
        return JSONResponse(content=twiml, media_type="application/xml")
        
    except Exception as e:
        logger.error(f"Twilio webhook error: {e}")
        return JSONResponse(
            content=twilio_service.generate_webhook_response("hangup"),
            media_type="application/xml"
        )


# === WebSocket for Real-time Updates ===

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    connected_clients[client_id] = websocket
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            
    except WebSocketDisconnect:
        if client_id in connected_clients:
            del connected_clients[client_id]
        logger.info(f"Client {client_id} disconnected")


async def broadcast_update(message: Dict):
    """Broadcast update to all connected clients"""
    if connected_clients:
        disconnected = []
        for client_id, websocket in connected_clients.items():
            try:
                await websocket.send_text(json.dumps(message))
            except:
                disconnected.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected:
            del connected_clients[client_id]


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )