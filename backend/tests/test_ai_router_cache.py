import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

from starlette.requests import Request

from app.ai import router as ai_router


def test_chat_cache_hit_skips_ai_provider(monkeypatch):
    cached_reply = "The laptop costs INR 50000."

    monkeypatch.setattr(
        ai_router,
        "retrieve_product_context",
        AsyncMock(return_value="Laptop context"),
    )
    monkeypatch.setattr(
        ai_router,
        "get_cached_reply",
        AsyncMock(return_value=cached_reply),
    )
    generate_mock = AsyncMock()
    monkeypatch.setattr(
        ai_router,
        "generate_reply",
        generate_mock,
    )

    async def run_test():
        result = await ai_router.chat(
            request=Request(
    {
        "type": "http",
        "method": "POST",
        "path": "/ai/chat",
        "headers": [],
        "query_string": b"",
        "server": ("testserver", 80),
        "client": ("testclient", 12345),
        "scheme": "http",
        "http_version": "1.1",
        "app": None,
    }
),
            chat_request=ai_router.ChatRequest(
                message="Recommend a laptop"
            ),
            current_user=SimpleNamespace(),
            db=SimpleNamespace(),
        )

        assert result.reply == cached_reply
        generate_mock.assert_not_awaited()

    asyncio.run(run_test())


def test_chat_cache_miss_generates_and_caches_reply(monkeypatch):
    product_context = "Laptop context"
    generated_reply = "I found a matching laptop."

    monkeypatch.setattr(
        ai_router,
        "retrieve_product_context",
        AsyncMock(return_value=product_context),
    )
    monkeypatch.setattr(
        ai_router,
        "get_cached_reply",
        AsyncMock(return_value=None),
    )
    generate_mock = AsyncMock(return_value=generated_reply)
    monkeypatch.setattr(
        ai_router,
        "generate_reply",
        generate_mock,
    )
    cache_mock = AsyncMock(return_value=True)
    monkeypatch.setattr(
        ai_router,
        "cache_reply",
        cache_mock,
    )

    async def run_test():
        result = await ai_router.chat(
            request=Request(
    {
        "type": "http",
        "method": "POST",
        "path": "/ai/chat",
        "headers": [],
        "query_string": b"",
        "server": ("testserver", 80),
        "client": ("testclient", 12345),
        "scheme": "http",
        "http_version": "1.1",
        "app": None,
    }
),
            chat_request=ai_router.ChatRequest(
                message="Recommend a laptop"
            ),
            current_user=SimpleNamespace(),
            db=SimpleNamespace(),
        )

        assert result.reply == generated_reply
        generate_mock.assert_awaited_once_with(
            "Recommend a laptop",
            product_context=product_context,
        )
        cache_mock.assert_awaited_once_with(
            "Recommend a laptop",
            product_context,
            generated_reply,
        )

    asyncio.run(run_test())
def test_stream_cache_hit_sends_sources_and_skips_ai(monkeypatch):
    products = [
        SimpleNamespace(
            id=1,
            name="Laptop",
            category="Electronics",
            price=50000,
            stock=5,
            image_url="/uploads/laptop.jpg",
        )
    ]

    cached_reply = "The laptop costs INR 50000."

    monkeypatch.setattr(
        ai_router,
        "retrieve_products",
        AsyncMock(return_value=products),
    )
    monkeypatch.setattr(
        ai_router,
        "_build_product_context",
        lambda items: "Laptop context",
    )
    monkeypatch.setattr(
        ai_router,
        "format_product_sources",
        lambda items: [{"id": 1, "name": "Laptop"}],
    )
    monkeypatch.setattr(
        ai_router,
        "get_cached_reply",
        AsyncMock(return_value=cached_reply),
    )

    generate_mock = AsyncMock()
    monkeypatch.setattr(
        ai_router,
        "generate_reply_stream",
        generate_mock,
    )

    async def run_test():
        response = await ai_router.chat_stream(
            request=Request(
                {
                    "type": "http",
                    "method": "POST",
                    "path": "/ai/chat/stream",
                    "headers": [],
                    "query_string": b"",
                    "server": ("testserver", 80),
                    "client": ("testclient", 12345),
                    "scheme": "http",
                    "http_version": "1.1",
                    "app": None,
                }
            ),
            chat_request=ai_router.ChatRequest(
                message="Recommend a laptop"
            ),
            current_user=SimpleNamespace(),
            db=SimpleNamespace(),
        )

        events = [
            event
            async for event in response.body_iterator
        ]
        body = "".join(
            event.decode() if isinstance(event, bytes) else event
            for event in events
        )

        assert "event: sources" in body
        assert '"name": "Laptop"' in body
        assert cached_reply in body
        assert "event: done" in body
        generate_mock.assert_not_awaited()

    asyncio.run(run_test())    