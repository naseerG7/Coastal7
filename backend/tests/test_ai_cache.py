import asyncio

from redis.exceptions import RedisError

from app.core import ai_cache


class FakeRedis:
    """In-memory Redis replacement for isolated unit tests."""

    def __init__(self):
        self.values = {}
        self.expirations = {}
        self.closed = False

    async def get(self, key):
        return self.values.get(key)

    async def set(self, key, value, ex):
        self.values[key] = value
        self.expirations[key] = ex

    async def aclose(self):
        self.closed = True


class BrokenRedis:
    """Simulate Redis connection failures."""

    async def get(self, key):
        raise RedisError("Redis unavailable")

    async def set(self, key, value, ex):
        raise RedisError("Redis unavailable")

    async def aclose(self):
        raise RedisError("Redis unavailable")


def test_cache_write_and_read(monkeypatch):
    redis = FakeRedis()
    monkeypatch.setattr(ai_cache, "_redis", redis)

    async def run_test():
        saved = await ai_cache.cache_reply(
            "  Show me laptops  ",
            "Laptop product context",
            "Here are some laptops.",
        )

        result = await ai_cache.get_cached_reply(
            "show me laptops",
            "Laptop product context",
        )

        assert saved is True
        assert result == "Here are some laptops."
        assert len(redis.values) == 1
        assert list(redis.expirations.values()) == [
            ai_cache.AI_CACHE_TTL_SECONDS
        ]

    asyncio.run(run_test())


def test_cache_miss_returns_none(monkeypatch):
    monkeypatch.setattr(ai_cache, "_redis", FakeRedis())

    result = asyncio.run(
        ai_cache.get_cached_reply("unknown question", None)
    )

    assert result is None


def test_different_product_context_uses_different_keys():
    key_one = ai_cache._cache_key(
        "recommend a laptop",
        "Laptop A",
    )
    key_two = ai_cache._cache_key(
        "recommend a laptop",
        "Laptop B",
    )

    assert key_one != key_two


def test_message_normalization_uses_same_key():
    key_one = ai_cache._cache_key("  HELLO  ", None)
    key_two = ai_cache._cache_key("hello", None)

    assert key_one == key_two


def test_blank_reply_is_not_cached(monkeypatch):
    redis = FakeRedis()
    monkeypatch.setattr(ai_cache, "_redis", redis)

    result = asyncio.run(
        ai_cache.cache_reply("hello", None, "   ")
    )

    assert result is False
    assert redis.values == {}


def test_disabled_cache_does_not_write(monkeypatch):
    redis = FakeRedis()
    monkeypatch.setattr(ai_cache, "_redis", redis)
    monkeypatch.setattr(ai_cache, "AI_CACHE_TTL_SECONDS", 0)

    result = asyncio.run(
        ai_cache.cache_reply("hello", None, "Hello!")
    )

    assert result is False
    assert redis.values == {}


def test_redis_errors_fail_gracefully(monkeypatch):
    monkeypatch.setattr(ai_cache, "_redis", BrokenRedis())

    async def run_test():
        result = await ai_cache.get_cached_reply("hello", None)
        saved = await ai_cache.cache_reply(
            "hello",
            None,
            "Hello!",
        )

        assert result is None
        assert saved is False

    asyncio.run(run_test())


def test_close_cache_closes_and_resets_client(monkeypatch):
    redis = FakeRedis()
    monkeypatch.setattr(ai_cache, "_redis", redis)

    asyncio.run(ai_cache.close_ai_cache())

    assert redis.closed is True
    assert ai_cache._redis is None


def test_close_cache_resets_client_even_if_redis_fails(
    monkeypatch,
):
    monkeypatch.setattr(ai_cache, "_redis", BrokenRedis())

    asyncio.run(ai_cache.close_ai_cache())

    assert ai_cache._redis is None