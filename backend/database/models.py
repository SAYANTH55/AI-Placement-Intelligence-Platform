from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True)
    password = Column(String) # Hashed password
    created_at = Column(DateTime(timezone=True), server_default=func.now())
