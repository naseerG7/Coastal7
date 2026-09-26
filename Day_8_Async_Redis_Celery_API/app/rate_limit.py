import time
from fastapi import HTTPException, Request
from app.redis_client import redis_client
from app.config import settings

def check_rate_limit(request: Request):
    client_id = request.client.host if request.client else "unknown"
    key = f"rate:{client_id}"
    now = time.time()
    window_start = now - settings.rate_limit_window
    pipe = redis_client.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, settings.rate_limit_window)
    _, _, count, _ = pipe.execute()
    if count > settings.rate_limit_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
