from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token, oauth2_scheme
from app.models import Cart, CartItem, Product
from app.schemas.cart import CartItemCreate


router = APIRouter(prefix="/cart", tags=["Cart"])


def get_user_id_from_token(token: str) -> int:
    try:
        return decode_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )


# ============================================================
# ADD PRODUCT TO CART
# ============================================================

@router.post("/items")
async def add_to_cart(
    item_data: CartItemCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_user_id_from_token(token)

    # Find product
    result = await db.execute(
        select(Product).where(Product.id == item_data.product_id)
    )

    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    # Check stock
    if item_data.quantity > product.stock:
        raise HTTPException(
            status_code=400,
            detail=f"Only {product.stock} item(s) available in stock",
        )

    # Find user's cart
    result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
    )

    cart = result.scalar_one_or_none()

    # Create cart if it doesn't exist
    if not cart:
        cart = Cart(user_id=user_id)

        db.add(cart)

        await db.flush()

    # Check whether product is already in cart
    result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == item_data.product_id,
        )
    )

    cart_item = result.scalar_one_or_none()

    if cart_item:

        new_quantity = cart_item.quantity + item_data.quantity

        if new_quantity > product.stock:
            raise HTTPException(
                status_code=400,
                detail=f"Only {product.stock} item(s) available in stock",
            )

        cart_item.quantity = new_quantity

    else:

        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
        )

        db.add(cart_item)

    await db.commit()

    await db.refresh(cart_item)

    return {
        "message": "Product added to cart",
        "cart_item_id": cart_item.id,
        "product_id": cart_item.product_id,
        "quantity": cart_item.quantity,
    }


# ============================================================
# GET CART WITH PRODUCT DETAILS
# ============================================================

@router.get("")
async def get_cart(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_user_id_from_token(token)

    # Find cart
    result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
    )

    cart = result.scalar_one_or_none()

    # User doesn't have a cart yet
    if not cart:
        return {
            "id": 0,
            "user_id": user_id,
            "items": [],
            "total": 0,
        }

    # Get cart items + product information
    result = await db.execute(
        select(CartItem, Product)
        .join(
            Product,
            CartItem.product_id == Product.id,
        )
        .where(CartItem.cart_id == cart.id)
    )

    rows = result.all()

    items = []
    cart_total = 0

    for cart_item, product in rows:

        item_total = float(product.price) * cart_item.quantity

        cart_total += item_total

        items.append(
            {
                "id": cart_item.id,
                "product_id": product.id,
                "name": product.name,
                "description": product.description,
                "price": float(product.price),
                "stock": product.stock,
                "image_url": product.image_url,
                "quantity": cart_item.quantity,
                "item_total": item_total,
            }
        )

    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": items,
        "total": cart_total,
    }


# ============================================================
# REMOVE PRODUCT FROM CART
# ============================================================

@router.delete("/items/{cart_item_id}")
async def remove_from_cart(
    cart_item_id: int,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    user_id = get_user_id_from_token(token)

    # Find user's cart
    result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
    )

    cart = result.scalar_one_or_none()

    if not cart:
        raise HTTPException(
            status_code=404,
            detail="Cart not found",
        )

    # Find cart item belonging to this cart
    result = await db.execute(
        select(CartItem).where(
            CartItem.id == cart_item_id,
            CartItem.cart_id == cart.id,
        )
    )

    cart_item = result.scalar_one_or_none()

    if not cart_item:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found",
        )

    await db.delete(cart_item)

    await db.commit()

    return {
        "message": "Product removed from cart",
        "cart_item_id": cart_item_id,
    }