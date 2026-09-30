from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token, oauth2_scheme
from app.models import Cart, CartItem, Product
from app.schemas.cart import CartItemCreate, CartItemResponse


router = APIRouter(prefix="/cart", tags=["Cart"])


@router.post("/items", response_model=CartItemResponse)
async def add_to_cart(
    item_data: CartItemCreate,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    # 1. Get the logged-in user's ID from the JWT
    try:
        user_id = decode_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    # 2. Find the product
    result = await db.execute(
        select(Product).where(Product.id == item_data.product_id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    # 3. Check that the requested quantity is available
    if item_data.quantity > product.stock:
        raise HTTPException(
            status_code=400,
            detail=f"Only {product.stock} item(s) available in stock",
        )

    # 4. Find the user's cart
    result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
    )
    cart = result.scalar_one_or_none()

    # 5. Create a cart if the user doesn't have one
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.flush()

    # 6. Check whether this product is already in the cart
    result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == item_data.product_id,
        )
    )
    cart_item = result.scalar_one_or_none()

    if cart_item:
        # 7. Increase existing quantity
        new_quantity = cart_item.quantity + item_data.quantity

        if new_quantity > product.stock:
            raise HTTPException(
                status_code=400,
                detail=f"Only {product.stock} item(s) available in stock",
            )

        cart_item.quantity = new_quantity

    else:
        # 8. Add a new cart item
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
        )
        db.add(cart_item)

    # 9. Save changes
    await db.commit()
    await db.refresh(cart_item)

    return cart_item