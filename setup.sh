#!/bin/bash

# Warm Transfer LiveKit Application - Setup Script
# Attack Capital Assignment

set -e

echo "🚀 Setting up Warm Transfer LiveKit Application..."
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Windows (Git Bash/WSL)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    print_status "Detected Windows environment"
    PYTHON_CMD="python"
    ACTIVATE_CMD="venv/Scripts/activate"
else
    print_status "Detected Unix-like environment"
    PYTHON_CMD="python3"
    ACTIVATE_CMD="venv/bin/activate"
fi

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Python
    if command -v $PYTHON_CMD &> /dev/null; then
        PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python not found. Please install Python 3.8+ from python.org"
        exit 1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION found"
    else
        print_error "Node.js not found. Please install Node.js 18+ from nodejs.org"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm $NPM_VERSION found"
    else
        print_error "npm not found. Please install npm"
        exit 1
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    print_status "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source $ACTIVATE_CMD
    
    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip
    
    # Install requirements
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Copy environment file
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit backend/.env with your API keys before running the application"
    else
        print_success "Backend .env file already exists"
    fi
    
    cd ..
    print_success "Backend setup completed"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Copy environment file
    if [ ! -f .env.local ]; then
        print_status "Creating .env.local file from template..."
        cp .env.example .env.local
        print_warning "Please edit frontend/.env.local with your configuration"
    else
        print_success "Frontend .env.local file already exists"
    fi
    
    cd ..
    print_success "Frontend setup completed"
}

# Setup project root
setup_root() {
    print_status "Setting up project root..."
    
    # Install root dependencies if package.json exists
    if [ -f package.json ]; then
        print_status "Installing root dependencies..."
        npm install
    fi
    
    # Create logs directory
    mkdir -p logs
    
    print_success "Root setup completed"
}

# Configuration guidance
show_configuration_guide() {
    echo ""
    echo "📋 CONFIGURATION REQUIRED"
    echo "========================"
    echo ""
    print_warning "Before running the application, you need to configure:"
    echo ""
    echo "1. Backend Configuration (backend/.env):"
    echo "   - LIVEKIT_URL: Your LiveKit server URL"
    echo "   - LIVEKIT_API_KEY: Your LiveKit API key"
    echo "   - LIVEKIT_API_SECRET: Your LiveKit API secret"
    echo "   - LLM Provider API key (OpenAI, Groq, or OpenRouter)"
    echo "   - Optional: Twilio credentials for phone integration"
    echo ""
    echo "2. Frontend Configuration (frontend/.env.local):"
    echo "   - NEXT_PUBLIC_LIVEKIT_URL: Same as backend LIVEKIT_URL"
    echo "   - NEXT_PUBLIC_API_BASE_URL: Backend URL (http://localhost:8000)"
    echo ""
    echo "📚 See README.md and DEVELOPMENT_GUIDE.md for detailed setup instructions"
    echo ""
}

# Show usage instructions
show_usage() {
    echo "🎯 QUICK START"
    echo "=============="
    echo ""
    print_success "Setup completed! Next steps:"
    echo ""
    echo "1. Configure your API keys (see above)"
    echo ""
    echo "2. Start the backend:"
    echo "   cd backend"
    echo "   source $ACTIVATE_CMD  # Activate virtual environment"
    echo "   python run.py"
    echo ""
    echo "3. In a new terminal, start the frontend:"
    echo "   cd frontend"
    echo "   npm run dev"
    echo ""
    echo "4. Open your browser:"
    echo "   http://localhost:3000 (Frontend)"
    echo "   http://localhost:8000/docs (Backend API docs)"
    echo ""
    echo "🐳 Alternative: Use Docker Compose"
    echo "   docker-compose up --build"
    echo ""
    echo "💡 For development workflow, see DEVELOPMENT_GUIDE.md"
    echo ""
}

# Main setup process
main() {
    echo "Attack Capital Assignment - Warm Transfer Implementation"
    echo ""
    
    check_prerequisites
    echo ""
    
    setup_root
    echo ""
    
    setup_backend
    echo ""
    
    setup_frontend
    echo ""
    
    print_success "🎉 Setup completed successfully!"
    echo ""
    
    show_configuration_guide
    show_usage
}

# Error handling
trap 'print_error "Setup failed. Please check the errors above and try again."' ERR

# Run main setup
main