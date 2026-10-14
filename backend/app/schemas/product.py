from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProductCreate(BaseModel):
    name: str
    category: str
    description: str | None = None
    price: float
    stock: int


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None


class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    description: str | None
    price: float
    stock: int
    image_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )