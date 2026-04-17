"""
Database module for AI Placement Intelligence Platform
"""

from .db import SessionLocal, engine
from . import models

__all__ = ["SessionLocal", "engine", "models"]
