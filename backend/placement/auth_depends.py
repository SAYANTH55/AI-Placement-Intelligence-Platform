from jose import jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User
import logging

logger = logging.getLogger("AI_Placement_Platform")

SECRET_KEY = "placement_platform_super_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            logger.warning(f"get_current_user: User with ID {user_id} not found")
            raise HTTPException(status_code=401, detail="User not found")
        logger.info(f"get_current_user: Authenticated user {user.email} (Role: {user.role})")
        return user
    except Exception as e:
        logger.error(f"get_current_user: Token validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Token validation failed {str(e)}")

def require_role(roles: list[str]):
    def role_checker(user: User = Depends(get_current_user)):
        import sys
        print(f"!!! SECURITY CHECK !!! User: {user.email}, Role: {user.role}, Allowed: {roles}", flush=True)
        
        # Admin bypass
        if user.role == "admin":
            return user
            
        if user.role in roles:
            return user
            
        print(f"!!! ACCESS DENIED !!! User: {user.email}, Role: {user.role} is not in {roles}", flush=True)
        raise HTTPException(status_code=403, detail="Insufficient permissions (TRACE 1)")
    return role_checker
