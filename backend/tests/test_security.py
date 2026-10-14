
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    decode_access_token,
)


def test_create_and_decode_access_token():
    user_id = 123

    token = create_access_token(user_id)

    assert isinstance(token, str)
    assert decode_access_token(token) == user_id


def test_access_token_contains_expiration():
    token = create_access_token(123)

    payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
    )

    assert payload["sub"] == "123"
    assert "exp" in payload

    expires_at = datetime.fromtimestamp(
        payload["exp"],
        tz=timezone.utc,
    )
    now = datetime.now(timezone.utc)

    assert now < expires_at <= now + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES,
        seconds=5,
    )


def test_invalid_access_token_is_rejected():
    with pytest.raises(ValueError, match="Invalid or expired token"):
        decode_access_token("this-is-not-a-valid-jwt")


def test_expired_access_token_is_rejected():
    expired_token = jwt.encode(
        {
            "sub": "123",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=5),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    with pytest.raises(ValueError, match="Invalid or expired token"):
        decode_access_token(expired_token)


def test_access_token_with_wrong_secret_is_rejected():
    wrong_secret = "x" * 64
    token = jwt.encode(
        {
            "sub": "123",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        wrong_secret,
        algorithm=ALGORITHM,
    )

    with pytest.raises(ValueError, match="Invalid or expired token"):
        decode_access_token(token)
