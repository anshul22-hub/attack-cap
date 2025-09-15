# Development and Setup Guide

## Prerequisites Installation

### 1. Python Environment
```bash
# Install Python 3.8+ from python.org
python --version  # Verify installation

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

### 2. Node.js Environment
```bash
# Install Node.js 18+ from nodejs.org
node --version  # Verify installation
npm --version   # Verify npm
```

### 3. Required API Keys

#### LiveKit Setup
1. Go to [LiveKit Cloud](https://cloud.livekit.io/)
2. Create account and project
3. Get API Key and API Secret
4. Note your LiveKit URL

#### LLM Provider Setup (Choose One)

**Option A: OpenAI**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create API key
3. Add credits to account

**Option B: Groq**
1. Go to [Groq Console](https://console.groq.com/)
2. Create free account
3. Generate API key

**Option C: OpenRouter**
1. Go to [OpenRouter](https://openrouter.ai/)
2. Create account
3. Get API key for free models

#### Optional: Twilio Setup
1. Go to [Twilio Console](https://console.twilio.com/)
2. Create account (free trial available)
3. Get Account SID and Auth Token
4. Purchase phone number

## Backend Development Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file:
```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# LLM Provider (choose one)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key

# Server Configuration
HOST=localhost
PORT=8000
DEBUG=true
```

### 3. Run Development Server
```bash
python run.py
```

### 4. Verify Backend
- API: http://localhost:8000
- Health: http://localhost:8000/health
- Docs: http://localhost:8000/docs

## Frontend Development Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_MODE=true
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Verify Frontend
- App: http://localhost:3000
- Should show system status with health indicators

## Development Workflow

### 1. Code Structure

#### Backend Structure
```
backend/
├── src/
│   ├── agents/
│   │   ├── __init__.py
│   │   └── agent_system.py     # Agent A & B classes
│   ├── services/
│   │   ├── __init__.py
│   │   ├── livekit_service.py  # LiveKit integration
│   │   ├── llm_service.py      # LLM providers
│   │   └── twilio_service.py   # Phone integration
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Data models
│   ├── config.py               # Configuration
│   └── main.py                 # FastAPI app
├── requirements.txt
└── run.py
```

#### Frontend Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Main layout
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── WelcomeScreen.tsx   # Demo start screen
│   │   ├── CallInterface.tsx   # Active call UI
│   │   ├── AgentDashboard.tsx  # Agent status
│   │   └── LoadingSpinner.tsx  # Loading component
│   ├── store/
│   │   └── callStore.ts        # State management
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── utils/
│   │   └── api.ts              # API client
│   └── styles/
│       └── globals.css         # Global styles
├── package.json
└── tailwind.config.js
```

### 2. Adding New Features

#### Backend: New Agent Type
```python
# In src/agents/agent_system.py
class SpecializedAgent(BaseAgent):
    def __init__(self, identity: str, specialty: str):
        super().__init__(identity, f"Specialist ({specialty})", AgentRole.AGENT_B)
        self.specialty = specialty
    
    async def handle_specialized_request(self, request_type: str):
        # Custom logic for specialized handling
        pass
```

#### Frontend: New Component
```typescript
// In src/components/NewComponent.tsx
'use client';

import React from 'react';
import { useCallStore } from '@/store/callStore';

const NewComponent: React.FC = () => {
  const { currentSession } = useCallStore();
  
  return (
    <div className="card">
      {/* Component content */}
    </div>
  );
};

export default NewComponent;
```

### 3. Testing During Development

#### Backend Testing
```bash
# Health check
curl http://localhost:8000/health

# Create call
curl -X POST "http://localhost:8000/api/calls/create?caller_identity=test_caller"

# List agents
curl http://localhost:8000/api/agents
```

#### Frontend Testing
1. Open http://localhost:3000
2. Check system status indicators
3. Try creating a demo call
4. Test agent login flows

### 4. Common Development Issues

#### Backend Issues
```bash
# Module import errors
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Port already in use
lsof -ti:8000 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :8000   # Windows

# Missing dependencies
pip install -r requirements.txt --upgrade
```

#### Frontend Issues
```bash
# Node modules corruption
rm -rf node_modules package-lock.json
npm install

# TypeScript errors
npm run type-check

# Build errors
npm run build
```

## Database Integration (Optional)

### Adding Persistence
```python
# In requirements.txt
sqlalchemy==2.0.23
alembic==1.13.1
asyncpg==0.29.0  # for PostgreSQL

# Create database models
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class CallSession(Base):
    __tablename__ = "call_sessions"
    
    session_id = Column(String, primary_key=True)
    caller_identity = Column(String, nullable=False)
    call_summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
```

## Production Deployment

### Docker Setup
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - LIVEKIT_URL=${LIVEKIT_URL}
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
      - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://backend:8000
      - NEXT_PUBLIC_LIVEKIT_URL=${LIVEKIT_URL}
    depends_on:
      - backend
```

## Security Considerations

### API Security
```python
# Add CORS configuration
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add API key authentication
from fastapi import Security, HTTPException
from fastapi.security.api_key import APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return api_key
```

### Environment Security
- Never commit `.env` files
- Use different keys for development/production
- Rotate API keys regularly
- Use HTTPS in production
- Implement rate limiting

## Monitoring and Logging

### Backend Logging
```python
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Usage in code
logger.info(f"Call session created: {session_id}")
logger.error(f"Transfer failed: {error}")
```

### Frontend Monitoring
```typescript
// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Application error:', error, errorInfo);
    // Send to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## Performance Optimization

### Backend Optimization
```python
# Use async everywhere
async def optimized_handler():
    # Concurrent operations
    results = await asyncio.gather(
        livekit_service.create_room(room_name),
        llm_service.generate_summary(history),
        agent_manager.get_available_agents()
    )
    return results

# Connection pooling
from sqlalchemy.pool import QueuePool
engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30
)
```

### Frontend Optimization
```typescript
// Code splitting
const CallInterface = lazy(() => import('./CallInterface'));
const AgentDashboard = lazy(() => import('./AgentDashboard'));

// Memoization
const MemoizedComponent = React.memo(CallInterface);

// State optimization
const useOptimizedStore = create<State>((set) => ({
  // Only update what's necessary
  updateAgent: (agent) => set((state) => ({
    agents: state.agents.map(a => a.id === agent.id ? agent : a)
  }))
}));
```

This guide provides comprehensive setup and development information for extending and maintaining the warm transfer application.