"""
Rate Limiting Middleware for FastAPI
Prevents API abuse by limiting requests per user per endpoint
"""

from datetime import datetime, timedelta
from typing import Optional, Callable
from functools import wraps
from fastapi import Request, HTTPException
from database.models import RateLimitTracker
from database.db import get_session

# Configuration
RATE_LIMITS = {
    "/upload_resume": {
        "requests_per_hour": 20,  # 20 resume uploads per hour per user
        "burst_limit": 5,  # Max 5 within 5 minute window
    },
    "/predict_placement": {
        "requests_per_hour": 100,
    },
    "/analyze_jd": {
        "requests_per_hour": 50,
    },
    "/get_dashboard": {
        "requests_per_hour": 100,
    },
}

BURST_WINDOW_MINUTES = 5


def get_user_id_from_request(request: Request) -> Optional[int]:
    """Extract user ID from JWT token or session"""
    # TODO: Implement JWT extraction if using token auth
    # For now, use session or header-based identification
    user_id = request.headers.get("X-User-ID")
    return int(user_id) if user_id else None


def check_rate_limit(endpoint: str, user_id: int) -> tuple[bool, Optional[str]]:
    """
    Check if user has exceeded rate limit for endpoint
    
    Returns: (is_allowed: bool, error_message: Optional[str])
    """
    if endpoint not in RATE_LIMITS:
        return True, None  # No limit for this endpoint
    
    config = RATE_LIMITS[endpoint]
    session = get_session()
    
    try:
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)
        
        # Check hourly limit
        hourly_count = session.query(RateLimitTracker).filter(
            RateLimitTracker.user_id == user_id,
            RateLimitTracker.endpoint == endpoint,
            RateLimitTracker.window_start >= one_hour_ago,
        ).count()
        
        if hourly_count >= config["requests_per_hour"]:
            reset_time = (now + timedelta(hours=1)).isoformat()
            return False, f"Rate limit exceeded. {config['requests_per_hour']} requests per hour. Retry after {reset_time}"
        
        # Check burst limit (5-minute window)
        five_min_ago = now - timedelta(minutes=BURST_WINDOW_MINUTES)
        burst_count = session.query(RateLimitTracker).filter(
            RateLimitTracker.user_id == user_id,
            RateLimitTracker.endpoint == endpoint,
            RateLimitTracker.window_start >= five_min_ago,
        ).count()
        
        if burst_count >= config["burst_limit"]:
            wait_seconds = BURST_WINDOW_MINUTES * 60
            return False, f"Too many requests. Please wait {wait_seconds} seconds before trying again."
        
        # Record this request
        tracker = RateLimitTracker(
            user_id=user_id,
            endpoint=endpoint,
            window_end=now + timedelta(hours=1)
        )
        session.add(tracker)
        session.commit()
        
        return True, None
        
    except Exception as e:
        print(f"Rate limit check error: {e}")
        return True, None  # Allow if check fails (fail open)
    finally:
        session.close()


def rate_limit(endpoint: str):
    """Decorator for rate limiting endpoints"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            user_id = get_user_id_from_request(request)
            
            # Skip rate limit for anonymous users (optional)
            if user_id:
                is_allowed, error_msg = check_rate_limit(endpoint, user_id)
                if not is_allowed:
                    raise HTTPException(
                        status_code=429,
                        detail=error_msg
                    )
            
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


def cleanup_old_records(days: int = 1):
    """
    Clean up old rate limit records to keep DB size manageable
    Run periodically (e.g., daily via cron)
    """
    session = get_session()
    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        deleted = session.query(RateLimitTracker).filter(
            RateLimitTracker.window_end < cutoff
        ).delete()
        session.commit()
        print(f"✅ Cleaned up {deleted} old rate limit records")
        return deleted
    except Exception as e:
        print(f"⛔ Cleanup error: {e}")
        return 0
    finally:
        session.close()
