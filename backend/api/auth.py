from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import random
import re
import string
from passlib.context import CryptContext
from typing import Dict, Optional
import os
import sys
from sqlalchemy.orm import Session
from sqlalchemy import func

# Ensure services module is visible
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.email_service import send_otp_email
from database.db import get_db
from database.models import User, PR, Student
from placement.auth_depends import create_access_token, require_role

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OTP Store: { "identifier": {"otp": "123456", "expires": datetime, "attempts": 0} }
otp_store: Dict[str, dict] = {}

# --- Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    identifier: str  # Email or Phone

class RegisterRequest(BaseModel):
    fullName: str
    email: str
    password: str
    phoneNumber: str
    source: str
    course: str | None = None  # MCA, MSAIM
    department_id: int | None = None
    # role is always 'student' for self-registration

class CreateStaffRequest(BaseModel):
    fullName: str
    email: str
    password: str
    role: str  # 'pr' or 'admin'
    department_id: int | None = None

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

def normalize_phone(phone: str) -> str:
    """Strip all non-digit characters from a phone number."""
    return re.sub(r'\D', '', phone)

# --- Endpoints ---

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    email = request.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not pwd_context.verify(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token({"sub": str(user.id), "role": user.role, "course": user.course, "department_id": user.department_id})

    # Build the base user payload
    user_payload = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "course": user.course,
        "department_id": user.department_id
    }

    # For PR users, attach their pr_id so the frontend can call /pr/{pr_id}/students
    if user.role == "pr":
        pr_profile = db.query(PR).filter(PR.user_id == user.id).first()
        if pr_profile:
            user_payload["pr_id"] = pr_profile.id

    return {
        "message": "Login successful",
        "user": user_payload,
        "token": token
    }

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
        password=hashed_password,
        course=request.course,
        department_id=request.department_id,
        role="student"  # self-registration always creates student accounts
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create empty student profile to allow applications
    new_student = Student(
        user_id=new_user.id,
        batch="2024", # Default batch
        cgpa=0.0,
        profile_data={"skills": [], "experience": ""}
    )
    db.add(new_student)
    db.commit()
    
    print(f"[DEBUG] Student {new_user.email} registered with ID {new_user.id}")
    return {"message": "Registration successful"}


@router.post("/admin/create-staff")
async def create_staff(
    request: CreateStaffRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Admin-only: create a Placement Officer (pr) or Admin account."""
    email = request.email.lower().strip()
    if request.role not in ("pr", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'pr' or 'admin'")

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already in use")

    hashed = pwd_context.hash(request.password)
    new_user = User(
        name=request.fullName,
        email=email,
        phone=None,
        password=hashed,
        role=request.role,
        department_id=request.department_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if request.role == "pr":
        new_pr = PR(user_id=new_user.id, department_id=request.department_id)
        db.add(new_pr)
        db.commit()

    return {"message": f"{request.role.upper()} account created", "user_id": new_user.id}

@router.get("/admin/staff")
async def get_staff(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """Admin-only: fetch all PR and Admin accounts."""
    staff = db.query(User).filter(User.role.in_(["pr", "admin"])).all()
    result = []
    for s in staff:
        dept_name = s.department.name if getattr(s, 'department', None) else "Global Access"
        result.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "role": s.role,
            "department": dept_name,
            "created_at": s.created_at
        })
    return {"status": "success", "data": result}

@router.delete("/admin/staff/{user_id}")
async def delete_staff(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    """Admin-only: soft delete a PR or Admin account."""
    from database.models import PR, Student
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.role not in ["pr", "admin"]:
        raise HTTPException(status_code=400, detail="Can only delete staff accounts")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    if target_user.role == "pr":
        pr_profile = db.query(PR).filter(PR.user_id == user_id).first()
        if pr_profile:
            db.query(Student).filter(Student.pr_id == pr_profile.id).update({"pr_id": None})
            db.delete(pr_profile)
    
    # Soft delete
    target_user.role = "deactivated"
    target_user.password = "deactivated"
    db.commit()
    return {"status": "success", "message": "Staff account deactivated and access revoked."}

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    identifier = request.identifier.strip()
    
    # Detect whether input is email or phone (email contains "@")
    is_email = "@" in identifier
    
    user = None
    if is_email:
        # --- Email lookup (exact, case-insensitive) ---
        identifier = identifier.lower()
        user = db.query(User).filter(func.lower(User.email) == identifier).first()
        if user:
            print(f"[DEBUG] User found by email: {user.email}")
    else:
        # --- Phone lookup (flexible: match any stored phone that ends with input digits) ---
        # This handles country code differences:
        #   stored: "+91 9876543210"  →  digits: "919876543210"
        #   input:  "9876543210"      →  digits: "9876543210"
        #   "919876543210".endswith("9876543210") → True ✅
        input_digits = normalize_phone(identifier)
        if not input_digits:
            raise HTTPException(status_code=400, detail="Invalid phone number format")
        
        # Fetch all users and do suffix match on digits (SQLite doesn't support regex natively)
        all_users = db.query(User).filter(User.phone.isnot(None)).all()
        for candidate in all_users:
            stored_digits = normalize_phone(candidate.phone or "")
            if stored_digits.endswith(input_digits):
                user = candidate
                break
        
        if user:
            print(f"[DEBUG] User found by phone suffix match: stored='{user.phone}', input='{identifier}'")
            
    if not user:
        print(f"[DEBUG] Forgot password failed: No user found for identifier '{identifier}'")
        raise HTTPException(status_code=404, detail="User not found")

    # Generate OTP and store it keyed by the identifier the user provided
    otp = generate_otp()
    expiry = datetime.now() + timedelta(minutes=5)
    otp_store[identifier] = {
        "otp": otp,
        "expires": expiry,
        "attempts": 0
    }
    
    # Always send OTP via email to the user's registered address
    try:
        send_otp_email(user.email, otp)
        print(f"[DEBUG] OTP emailed to {user.email} for identifier '{identifier}'")
    except ValueError as e:
        del otp_store[identifier]
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
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
        user = db.query(User).filter(func.lower(User.email) == identifier).first()
    else:
        # Same flexible phone suffix match as forgot-password
        input_digits = normalize_phone(identifier)
        user = None
        all_users = db.query(User).filter(User.phone.isnot(None)).all()
        for candidate in all_users:
            stored_digits = normalize_phone(candidate.phone or "")
            if stored_digits.endswith(input_digits):
                user = candidate
                break
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.password = pwd_context.hash(request.new_password)
    db.commit()
    
    # Clear OTP store
    if identifier in otp_store:
        del otp_store[identifier]
        
    return {"message": "Password reset successfully. You can now login with your new password."}
