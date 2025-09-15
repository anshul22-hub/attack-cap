#!/usr/bin/env python3
"""
Warm Transfer LiveKit Application Server
"""
import uvicorn
from src.main import app
from src.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )