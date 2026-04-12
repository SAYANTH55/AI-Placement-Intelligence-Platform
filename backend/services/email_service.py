from __future__ import print_function
import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "sayanthir@gmail.com")

def send_otp_email(recipient_email: str, otp_code: str):
    """
    Sends a beautifully formatted 6-digit OTP code to the user's email address via Brevo API SDK.
    """
    # Dynamically fetch so if .env changes while running, we catch it
    BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
    FROM_EMAIL = os.getenv("FROM_EMAIL", "sayanthir@gmail.com")

    # Print API key to confirm loading (masking mostly for security)
    masked_key = f"{BREVO_API_KEY[:10]}...{BREVO_API_KEY[-4:]}" if len(BREVO_API_KEY) > 15 else "INVALID_LENGTH"
    print(f"[DEBUG] Reloaded BREVO_API_KEY from .env: {masked_key}")

    if not BREVO_API_KEY or "your_api_key_here" in BREVO_API_KEY:
        print("[WARNING] BREVO_API_KEY is missing or invalid in .env file.")
        raise ValueError("Email configuration error: BREVO_API_KEY is missing or strictly a placeholder. Please check your .env file.")
        

    # Configure API key authorization: api-key
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY

    # create an instance of the API class
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #F9FAFB; padding: 40px; color: #333;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #eee; text-align: center;">
          <h1 style="color: #F97316; font-size: 24px; margin-bottom: 5px;">Security Verification</h1>
          <p style="font-size: 15px; color: #666; margin-bottom: 25px;">Please use the following 6-digit code to verify your identity.</p>
          
          <div style="background-color: #F8F9FA; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="font-size: 32px; letter-spacing: 5px; color: #111; margin: 0;">{otp_code}</h2>
          </div>
          
          <p style="font-size: 13px; color: #999;">This security code will expire in exactly 5 minutes.</p>
          <br/>
          <p style="font-size: 12px; color: #aaa;">If you did not request this code, please ignore this email.</p>
        </div>
      </body>
    </html>
    """

    sender = {"name": "AI Placement", "email": FROM_EMAIL}
    to = [{"email": recipient_email}]
    
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        html_content=html_content,
        sender=sender,
        subject="AI Placement - Verification Code"
    )

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"[DEBUG] Verification OTP {otp_code} successfully delivered to {recipient_email} via Brevo SDK")
        return True
    except ApiException as e:
        print(f"[ERROR] Exception when calling TransactionalEmailsApi->send_transac_email: {e}")
        error_info = str(e)
        if hasattr(e, 'reason'):
            error_info = e.reason
        if hasattr(e, 'body'):
            error_info = str(e.body)
        raise Exception(f"{error_info}")


