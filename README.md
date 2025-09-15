# Warm Transfer LiveKit Application
**Attack Capital Assignment - Complete Implementation**

> **Real-time warm transfer system using LiveKit and LLMs for seamless agent handoffs**

## 🎯 Assignment Overview

This project implements a comprehensive warm transfer function using LiveKit for real-time communication and Large Language Models (LLMs) for intelligent call summaries and transfer context generation.

### ✨ Key Features

- **Real-time Communication**: LiveKit-powered audio/video rooms
- **Intelligent Warm Transfers**: Agent A → Agent B handoffs with AI-generated context
- **Multi-LLM Support**: OpenAI, Groq, and OpenRouter integration
- **Interactive Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Robust Backend**: Python FastAPI with async architecture
- **Optional Phone Integration**: Twilio SIP trunking for phone numbers
- **Professional UI**: Customer portal and agent dashboard
- **Real-time Updates**: WebSocket connections for live call status

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Customer      │    │    Agent A       │    │    Agent B      │
│   Portal        │    │   Dashboard      │    │   Dashboard     │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          │              ┌───────▼────────┐              │
          └──────────────►│   LiveKit      │◄─────────────┘
                         │     Room       │
                         └───────┬────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │     FastAPI Backend      │
                    │                          │
                    │  ┌─────────────────────┐ │
                    │  │   Agent System      │ │
                    │  │   - Agent A         │ │
                    │  │   - Agent B         │ │
                    │  │   - Transfer Logic  │ │
                    │  └─────────────────────┘ │
                    │                          │
                    │  ┌─────────────────────┐ │
                    │  │   LLM Service       │ │
                    │  │   - OpenAI          │ │
                    │  │   - Groq            │ │
                    │  │   - OpenRouter      │ │
                    │  └─────────────────────┘ │
                    │                          │
                    │  ┌─────────────────────┐ │
                    │  │  LiveKit Service    │ │
                    │  │  - Room Management  │ │
                    │  │  - Token Generation │ │
                    │  └─────────────────────┘ │
                    │                          │
                    │  ┌─────────────────────┐ │
                    │  │  Twilio Service     │ │
                    │  │  - SIP Integration  │ │
                    │  │  - Phone Numbers    │ │
                    │  └─────────────────────┘ │
                    └──────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (Download from [python.org](https://python.org))
- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org))
- **LiveKit Account** (Sign up at [livekit.io](https://livekit.io))
- **LLM API Access** (OpenAI, Groq, or OpenRouter)

### Automated Setup (Windows)

```cmd
# Clone the repository
git clone <repository-url>
cd Attack-CAP

# Run the automated setup script
setup.bat
```

### Manual Setup

1. **Backend Setup**
   ```cmd
   cd backend
   python -m venv venv
   venv\Scripts\activate.bat
   pip install -r requirements.txt
   copy .env.example .env
   # Edit .env with your API keys
   ```

2. **Frontend Setup**
   ```cmd
   cd frontend
   npm install
   copy .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Configuration**
   - See [Configuration Guide](#⚙️-configuration) below

### Running the Application

1. **Start Backend** (Terminal 1)
   ```cmd
   cd backend
   venv\Scripts\activate.bat
   python run.py
   ```

2. **Start Frontend** (Terminal 2)
   ```cmd
   cd frontend
   npm run dev
   ```

3. **Access Applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs

### Docker Setup (Alternative)

```cmd
# Run with Docker Compose
docker-compose up --build

# Access applications
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## ⚙️ Configuration

### Backend Configuration (`backend/.env`)
cp .env.example .env
# Edit .env with your API keys
```

#### Environment Configuration (.env)
```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# LLM Provider (choose one)
LLM_PROVIDER=openai  # or 'groq' or 'openrouter'
OPENAI_API_KEY=your-openai-api-key
GROQ_API_KEY=your-groq-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

# Optional Twilio
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Server Configuration
PORT=8000
HOST=localhost
DEBUG=true
```

#### Run Backend Server
```bash
# From backend directory
python run.py

# Or with uvicorn directly
uvicorn src.main:app --host localhost --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your URLs
```

#### Environment Configuration (.env.local)
```bash
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_MODE=true
```

#### Run Frontend Server
```bash
# From frontend directory
npm run dev
```

### 3. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🎮 Demo Workflow

### Customer Experience
1. **Start Call**: Enter name and click "Start Customer Call"
2. **Connect to Agent A**: Automatic connection to available Agent A
3. **Describe Issue**: Mention "billing" or "technical" problems
4. **Transfer**: Agent A initiates warm transfer to specialist
5. **Continue with Agent B**: Seamless handoff with full context

### Agent A Experience
1. **Answer Call**: Receive incoming customer call
2. **Listen & Assess**: Understand customer's needs
3. **Initiate Transfer**: Select appropriate specialist Agent B
4. **Provide Context**: System generates summary and explains to Agent B
5. **Exit Call**: Leave customer with Agent B

### Agent B Experience
1. **Receive Transfer**: Get warm transfer with full context
2. **Review Summary**: See AI-generated call summary
3. **Take Over**: Continue helping customer with specialized knowledge
4. **Complete Resolution**: Handle customer's specific needs

## 🔧 Technical Implementation

### Backend API Endpoints

#### Call Management
- `POST /api/calls/create` - Create new call session
- `POST /api/calls/{session_id}/join` - Join call session
- `POST /api/calls/{session_id}/transfer` - Initiate warm transfer
- `POST /api/calls/{session_id}/explain` - Generate transfer explanation
- `POST /api/calls/{session_id}/complete` - Complete transfer
- `GET /api/calls/{session_id}` - Get call information

#### Agent Management
- `GET /api/agents` - List all agents and status
- `GET /api/agents/{identity}` - Get specific agent status

#### Twilio Integration (Optional)
- `POST /api/twilio/call` - Initiate outbound call
- `POST /api/twilio/webhook/{session_id}` - Handle Twilio webhooks

### Core Classes

#### Backend
```python
# Agent System
class BaseAgent(ABC)
class AgentA(BaseAgent)  # Initial call handler
class AgentB(BaseAgent)  # Specialist receiver

# Services
class LiveKitService     # Room & participant management
class LLMService        # Call summarization
class TwilioService     # Phone integration
```

#### Frontend
```typescript
// State Management
interface CallStore {
  currentSession: CallSession | null;
  connectionInfo: LiveKitConnectionInfo | null;
  agents: Agent[];
  transferState: TransferState;
}

// Components
<WelcomeScreen />      // Initial demo interface
<CallInterface />      // Active call management
<AgentDashboard />     // Agent status monitoring
```

### Warm Transfer Flow Implementation

#### 1. Transfer Initiation
```python
# Agent A initiates transfer
transfer_room_sid = await agent_a.initiate_transfer(
    agent_b_identity="agent_b_billing",
    reason="Customer billing inquiry"
)
```

#### 2. Context Generation
```python
# LLM generates call summary
call_summary = await llm_service.generate_call_summary(
    conversation_history=agent_a.conversation_history
)

# Generate explanation for Agent B
explanation = await llm_service.generate_transfer_explanation(
    call_summary=call_summary,
    transfer_reason="Billing issue requires specialist",
    agent_b_context="Billing specialist"
)
```

#### 3. Transfer Completion
```python
# Agent B receives context
await agent_b.receive_transfer_context(explanation, call_summary)

# Agent A exits, final room created for customer + Agent B
final_room_sid = await livekit_service.complete_transfer(session_id)
```

## 🌐 Twilio Integration (Optional)

### Setup
1. **Twilio Account**: Create account and get credentials
2. **Phone Number**: Purchase Twilio phone number
3. **Webhook URLs**: Configure webhooks to point to your backend
4. **SIP Integration**: Set up SIP trunking for LiveKit connection

### Implementation
```python
# Initiate outbound call
call_sid = await twilio_service.initiate_call(TwilioCallRequest(
    phone_number="+1234567890",
    session_id=session_id,
    agent_identity=agent_a_identity,
    context="Customer support call"
))

# Handle webhook for call connection
@app.post("/api/twilio/webhook/{session_id}")
async def twilio_webhook(session_id: str):
    # Generate TwiML to connect call to LiveKit
    return twilio_service.generate_connect_twiml(session_id)
```

## 🎨 Customization

### Adding New LLM Providers
```python
class CustomLLMProvider(BaseLLMProvider):
    async def generate_call_summary(self, conversation_history):
        # Implement your LLM integration
        pass
    
    async def generate_transfer_explanation(self, call_summary, reason):
        # Implement transfer explanation generation
        pass
```

### Custom Agent Types
```python
class SpecializedAgent(BaseAgent):
    def __init__(self, identity: str, specialty: str):
        super().__init__(identity, f"Specialist ({specialty})", AgentRole.AGENT_B)
        self.specialty = specialty
    
    async def handle_specialized_request(self, request_type: str):
        # Handle specific types of requests
        pass
```

### UI Customization
- Modify `globals.css` for styling
- Update component props and interfaces in `types/index.ts`
- Add new components in `components/` directory
- Customize state management in `store/callStore.ts`

## 🧪 Testing

### Manual Testing
1. **Health Check**: Visit `/health` endpoint
2. **Agent Creation**: Verify default agents are created
3. **Call Flow**: Test complete customer journey
4. **Transfer Process**: Verify warm transfer with context
5. **Error Handling**: Test with invalid inputs

### API Testing
```bash
# Health check
curl http://localhost:8000/health

# Create call
curl -X POST "http://localhost:8000/api/calls/create?caller_identity=test_caller"

# List agents
curl http://localhost:8000/api/agents
```

### Demo Scenarios
1. **Billing Transfer**: Customer → Agent A → Billing Specialist
2. **Technical Transfer**: Customer → Agent A → Technical Support  
3. **Phone Integration**: Real phone → Agent A → Specialist

## 🔧 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.8+

# Verify dependencies
pip list

# Check environment variables
python -c "from src.config import settings; print(settings.livekit_url)"
```

#### Frontend Build Errors
```bash
# Clear dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+

# Verify environment
cat .env.local
```

#### LiveKit Connection Issues
- Verify LiveKit server is running
- Check API key and secret are correct
- Ensure WebSocket connection is allowed through firewall
- Test with LiveKit CLI tools

#### LLM API Errors
- Verify API key is valid and has credits
- Check rate limits and quotas
- Test API key with simple curl request
- Ensure correct provider is selected in `.env`

### Debug Mode
```bash
# Backend with debug logging
DEBUG=true python run.py

# Frontend with verbose logging
npm run dev -- --debug
```

## 📝 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### WebSocket Events
```typescript
// Real-time updates
interface WebSocketMessage {
  type: 'call_status' | 'transfer_update' | 'agent_status';
  data: any;
  timestamp: string;
}

// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/client_id');
```

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Use production values
2. **HTTPS**: Enable SSL for LiveKit and API
3. **Database**: Add persistent storage for call history
4. **Monitoring**: Add logging and metrics
5. **Scaling**: Use multiple backend instances with load balancer

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend Dockerfile  
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is created for the Attack Capital assignment demonstration.

## 🏆 Project Highlights

- ✅ **Complete Warm Transfer Flow**: Full implementation with context sharing
- ✅ **LLM Integration**: AI-generated call summaries and explanations
- ✅ **LiveKit Real-time**: Audio/video calling with room management
- ✅ **Modern Tech Stack**: FastAPI + Next.js + TypeScript
- ✅ **Extensible Architecture**: Easy to add new features and providers
- ✅ **Optional Twilio**: Real phone number integration
- ✅ **Interactive Demo**: User-friendly interface for testing
- ✅ **Comprehensive Documentation**: Detailed setup and usage guide

---

**Built for Attack Capital Assignment** | **LiveKit + LLM Warm Transfer Demo**