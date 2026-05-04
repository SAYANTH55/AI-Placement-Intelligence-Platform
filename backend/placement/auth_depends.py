from jose import jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import User

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
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed {str(e)}")

def require_role(roles: list[str]):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role not in roles and "admin" not in user.role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker
