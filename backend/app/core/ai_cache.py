import hashlib
import json
import os

from redis.asyncio import Redis
from redis.exceptions import RedisError


REDIS_URL = os.getenv(
    "SHOPFLOW_REDIS_URL",
    "redis://127.0.0.1:6379/0",
)

AI_CACHE_TTL_SECONDS = int(
    os.getenv("SHOPFLOW_AI_CACHE_TTL_SECONDS", "120")
)

_redis: Redis | None = None


def _get_redis() -> Redis:
    """Create the Redis client only when the cache is first used."""
    global _redis

    if _redis is None:
        _redis = Redis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=0.3,
            socket_timeout=0.3,
        )

    return _redis


def _cache_key(
    message: str,
    product_context: str | None,
) -> str:
    """Include the exact retrieved product context in the cache key."""
    payload = json.dumps(
        {
            "message": message.strip().casefold(),
            "product_context": product_context,
        },
        sort_keys=True,
        ensure_ascii=False,
    )

    digest = hashlib.sha256(
        payload.encode("utf-8")
    ).hexdigest()

    return f"shopflow:ai:reply:{digest}"


async def get_cached_reply(
    message: str,
    product_context: str | None,
) -> str | None:
    """Return a cached answer, or None if unavailable."""
    try:
        return await _get_redis().get(
            _cache_key(message, product_context)
        )
    except (RedisError, OSError, TimeoutError):
        return None


async def cache_reply(
    message: str,
    product_context: str | None,
    reply: str,
) -> bool:
    """Cache a completed answer with a short expiry."""
    if not reply.strip() or AI_CACHE_TTL_SECONDS <= 0:
        return False

    try:
        await _get_redis().set(
            _cache_key(message, product_context),
            reply,
            ex=AI_CACHE_TTL_SECONDS,
        )
        return True
    except (RedisError, OSError, TimeoutError):
        return False


async def close_ai_cache() -> None:
    """Close the Redis client during application shutdown."""
    global _redis

    if _redis is not None:
        try:
            await _redis.aclose()
        except (RedisError, OSError, TimeoutError):
            pass
        finally:
            _redis = None