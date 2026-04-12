from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import random
import string
from passlib.context import CryptContext
from typing import Dict, Optional
import os
import sys
from sqlalchemy.orm import Session

# Ensure services module is visible
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.email_service import send_otp_email
from database.db import get_db
from database.models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OTP Store: { "identifier": {"otp": "123456", "expires": datetime, "attempts": 0} }
otp_store: Dict[str, dict] = {}

# --- Schemas ---
class ForgotPasswordRequest(BaseModel):
    identifier: str  # Email or Phone

class RegisterRequest(BaseModel):
    fullName: str
    email: str
    password: str
    phoneNumber: str
    source: str

class VerifyOTPRequest(BaseModel):
    identifier: str
    otp: str

class ResetPasswordRequest(BaseModel):
    identifier: str
    token: str # In this mock, we'll use the identifier as a simple token after verification
    new_password: str

# --- Helper Functions ---
def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

# --- Endpoints ---

@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Normalize email to lowercase
    email = request.email.lower().strip()
    
    # Check if user already exists
    existing_user_email = db.query(User).filter(User.email == email).first()
    if existing_user_email:
        raise HTTPException(status_code=400, detail="User already exists with this email")
        
    existing_user_phone = db.query(User).filter(User.phone == request.phoneNumber).first()
    if existing_user_phone:
        raise HTTPException(status_code=400, detail="User already exists with this phone number")

    # Store user in database
    hashed_password = pwd_context.hash(request.password)
    new_user = User(
        name=request.fullName,
        email=email,
        phone=request.phoneNumber,
        password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print(f"[DEBUG] User {new_user.email} successfully registered with ID {new_user.id}")
    
    return {"message": "Registration successful"}

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    identifier = request.identifier.strip()
    
    # Check if identifier is email (contains @)
    is_email = "@" in identifier
    
    # Check if user exists (by email or phone) in Database
    user = None
    if is_email:
        identifier = identifier.lower()
        user = db.query(User).filter(User.email == identifier).first()
        if user:
            print(f"[DEBUG] User found in database by email: {user.email}")
    else:
        user = db.query(User).filter(User.phone == identifier).first()
        if user:
            print(f"[DEBUG] User found in database by phone: {user.phone}")
            
    if not user:
        print(f"[DEBUG] Forgot password failed: User with identifier '{identifier}' not found in database.")
        raise HTTPException(status_code=404, detail="User not found")

    # Generate OTP
    otp = generate_otp()
    expiry = datetime.now() + timedelta(minutes=5)
    
    # Store OTP using the original identifier so subsequent verifications match
    otp_store[identifier] = {
        "otp": otp,
        "expires": expiry,
        "attempts": 0
    }
    
    # Send actual email to the user's registered email address
    try:
        send_otp_email(user.email, otp)
        print(f"[DEBUG] Sent OTP email to {user.email} for identifier {identifier}")
    except ValueError as e:
        del otp_store[identifier]
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        # Revert OTP store if email completely failed
        del otp_store[identifier]
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {str(e)}")
    
    return {
        "message": "OTP sent successfully",
        "expires_in": "5 minutes"
    }

@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    identifier = request.identifier
    otp_data = otp_store.get(identifier)
    
    if not otp_data:
        raise HTTPException(status_code=400, detail="No OTP requested for this identifier")
    
    # Check expiry
    if datetime.now() > otp_data["expires"]:
        del otp_store[identifier]
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    # Check attempts
    if otp_data["attempts"] >= 3:
        del otp_store[identifier]
        raise HTTPException(status_code=403, detail="Too many attempts. Please request a new OTP.")
    
    # Verify OTP
    if otp_data["otp"] != request.otp:
        otp_data["attempts"] += 1
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {3 - otp_data['attempts']} attempts remaining.")
    
    # Success
    return {
        "message": "OTP verified successfully",
        "reset_token": identifier # Simplified for demo
    }

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    identifier = request.identifier
    
    is_email = "@" in identifier
    if is_email:
        identifier = identifier.lower()
        user = db.query(User).filter(User.email == identifier).first()
    else:
        user = db.query(User).filter(User.phone == identifier).first()
        
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.password = pwd_context.hash(request.new_password)
    db.commit()
    
    # Clear OTP store
    if identifier in otp_store:
        del otp_store[identifier]
        
    return {"message": "Password reset successfully. You can now login with your new password."}
