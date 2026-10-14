import os

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import decode_access_token


AUTH_RATE_LIMIT = os.getenv(
    "SHOPFLOW_AUTH_RATE_LIMIT",
    "5/minute",
)

AI_RATE_LIMIT = os.getenv(
    "SHOPFLOW_AI_RATE_LIMIT",
    "10/minute",
)


def get_rate_limit_key(request: Request) -> str:
    """
    Use the authenticated user ID when a valid JWT is supplied.
    Otherwise, fall back to the client's IP address.
    """
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")

    if scheme.lower() == "bearer" and token:
        try:
            user_id = decode_access_token(token)
            return f"user:{user_id}"
        except ValueError:
            pass

    return f"ip:{get_remote_address(request)}"


limiter = Limiter(
    key_func=get_rate_limit_key,
)