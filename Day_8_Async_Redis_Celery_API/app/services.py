import asyncio
import httpx
from app.redis_client import redis_client
from app.config import settings

async def fetch_url(client, url):
    response = await client.get(url, timeout=10)
    response.raise_for_status()
    return {"url": url, "status_code": response.status_code, "length": len(response.text)}

async def fetch_urls_concurrently(urls):
    async with httpx.AsyncClient() as client:
        return await asyncio.gather(*(fetch_url(client, url) for url in urls))

def get_cached(key):
    return redis_client.get(key)

def set_cached(key, value, ttl=None):
    redis_client.setex(key, ttl or settings.cache_ttl, value)
