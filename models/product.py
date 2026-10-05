from datetime import datetime

from sqlalchemy import DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    # =========================================================
    # PRODUCT ID
    # =========================================================

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    # =========================================================
    # PRODUCT NAME
    # =========================================================

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    # =========================================================
    # PRODUCT CATEGORY
    #
    # Examples:
    # Mobiles
    # Electronics
    # Fashion
    # Home & Kitchen
    # Gaming
    # =========================================================

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="General"
    )

    # =========================================================
    # PRODUCT DESCRIPTION
    # =========================================================

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    # =========================================================
    # PRODUCT PRICE
    # =========================================================

    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    # =========================================================
    # PRODUCT STOCK
    # =========================================================

    stock: Mapped[int] = mapped_column(
        default=0,
        nullable=False
    )

    # =========================================================
    # PRODUCT IMAGE
    # =========================================================

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    # =========================================================
    # CREATED DATE
    # =========================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # =========================================================
    # UPDATED DATE
    # =========================================================

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )