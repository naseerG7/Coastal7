from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# PRODUCT BASE
# =========================================================

class ProductBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=200
    )

    category: str = Field(
        default="General",
        max_length=100
    )

    description: str | None = None

    price: float = Field(
        ...,
        gt=0
    )

    stock: int = Field(
        default=0,
        ge=0
    )


# =========================================================
# PRODUCT CREATE
# =========================================================

class ProductCreate(ProductBase):
    pass


# =========================================================
# PRODUCT UPDATE
# =========================================================

class ProductUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200
    )

    category: str | None = Field(
        default=None,
        max_length=100
    )

    description: str | None = None

    price: float | None = Field(
        default=None,
        gt=0
    )

    stock: int | None = Field(
        default=None,
        ge=0
    )


# =========================================================
# PRODUCT RESPONSE
# =========================================================

class ProductResponse(BaseModel):
    id: int

    name: str

    category: str

    description: str | None = None

    price: float

    stock: int

    image_url: str | None = None

    created_at: datetime | None = None

    updated_at: datetime | None = None

    model_config = ConfigDict(
        from_attributes=True
    )