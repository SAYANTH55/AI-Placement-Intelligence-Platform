from __future__ import print_function
import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random
import string

# Load environment variables
load_dotenv(override=True)

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "sayanthir@gmail.com")
OTP_EXPIRY_MINUTES = 5


def send_otp_email(recipient_email: str, otp_code: str) -> dict:
    """
    ✅ IMPROVED: Sends OTP email via Brevo API with better error handling
    
    Returns: {
        "success": bool,
        "message": str,
        "error": Optional[str]
    }
    """
    try:
        # Dynamically fetch so if .env changes while running, we catch it
        BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
        FROM_EMAIL = os.getenv("FROM_EMAIL", "sayanthir@gmail.com")

        # Validate API key
        if not BREVO_API_KEY or "your_api_key_here" in BREVO_API_KEY:
            error_msg = "❌ BREVO_API_KEY is missing or invalid. Check your .env file."
            print(f"[ERROR] {error_msg}")
            return {
                "success": False,
                "message": "Email service not configured",
                "error": error_msg
            }
        
        # Configure API
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = BREVO_API_KEY
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        # Build email
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #F9FAFB; padding: 40px; color: #333;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #eee; text-align: center;">
              <h1 style="color: #F97316; font-size: 24px; margin-bottom: 5px;">🔐 Security Verification</h1>
              <p style="font-size: 15px; color: #666; margin-bottom: 25px;">Please use the following 6-digit code to verify your identity.</p>
              
              <div style="background-color: #F5F5F5; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #F97316;">
                <h2 style="font-size: 36px; letter-spacing: 8px; color: #111; margin: 0; font-family: 'Courier New', monospace; font-weight: bold;">{otp_code}</h2>
              </div>
              
              <p style="font-size: 13px; color: #999;">⏱️ This code will expire in <strong>{OTP_EXPIRY_MINUTES} minutes</strong></p>
              <p style="font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 15px;">
                If you did not request this code, please ignore this email and your account is safe.
              </p>
            </div>
          </body>
        </html>
        """
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": recipient_email}],
            headers={"X-Mailin-custom": "custom_header_value"},
            html_content=html_content,
            sender={"name": "AI Placement Platform", "email": FROM_EMAIL},
            subject="🔐 Your Security Code - Expires in 5 Minutes"
        )
        
        # Send email
        response = api_instance.send_transac_email(send_smtp_email)
        
        print(f"✅ OTP email sent successfully to {recipient_email}")
        print(f"   Message ID: {response.message_id}")
        
        return {
            "success": True,
            "message": f"OTP sent to {recipient_email}",
            "message_id": response.message_id
        }
        
    except ApiException as e:
        error_msg = f"Brevo API Error: {e}"
        print(f"[ERROR] {error_msg}")
        return {
            "success": False,
            "message": "Failed to send OTP email",
            "error": str(e)
        }
    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        print(f"[ERROR] {error_msg}")
        return {
            "success": False,
            "message": "Email service error",
            "error": str(e)
        }


def generate_otp() -> str:
    """Generate a 6-digit OTP code"""
    return ''.join(random.choices(string.digits, k=6))


def send_reset_email(recipient_email: str, reset_link: str) -> dict:
    """Send password reset link email"""
    try:
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = BREVO_API_KEY
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #F9FAFB; padding: 40px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; text-align: center;">
              <h1 style="color: #F97316;">Reset Your Password</h1>
              <p style="color: #666; margin: 20px 0;">Click the button below to reset your password.</p>
              <a href="{reset_link}" style="display: inline-block; background: #F97316; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">This link expires in 1 hour.</p>
            </div>
          </body>
        </html>
        """
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": recipient_email}],
            html_content=html_content,
            sender={"name": "AI Placement Platform", "email": FROM_EMAIL},
            subject="Reset Your Password"
        )
        
        response = api_instance.send_transac_email(send_smtp_email)
        
        return {
            "success": True,
            "message": "Reset email sent",
            "message_id": response.message_id
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": "Failed to send reset email",
            "error": str(e)
        }


def is_otp_expired(created_at: datetime) -> bool:
    """Check if OTP has expired"""
    return datetime.utcnow() > created_at + timedelta(minutes=OTP_EXPIRY_MINUTES)



