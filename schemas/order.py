# Order schemas will be added later.
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


# ============================================================
# ORDER ITEM
# ============================================================

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: Decimal
    quantity: int
    item_total: Decimal

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# ORDER RESPONSE
# ============================================================

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# ORDER DETAIL RESPONSE
# ============================================================

class OrderDetailResponse(BaseModel):
    id: int
    user_id: int
    total_amount: Decimal
    status: str
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# UPDATE ORDER STATUS
# ============================================================

class OrderStatusUpdate(BaseModel):
    status: str