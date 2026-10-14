import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import User


async def reset_customer_passwords():
    customers = {
        "naseer1@example.com": "Customer@123",
        "naseer2@example.com": "Customer@123",
    }

    async with AsyncSessionLocal() as db:
        for email, new_password in customers.items():

            result = await db.execute(
                select(User).where(User.email == email)
            )

            user = result.scalar_one_or_none()

            if not user:
                print(f"User not found: {email}")
                continue

            if user.role != "customer":
                print(f"Skipping {email}: account is not a customer")
                continue

            user.hashed_password = hash_password(new_password)

            print(f"Password reset for: {email}")

        await db.commit()

    print()
    print("Customer password reset completed.")


if __name__ == "__main__":
    asyncio.run(reset_customer_passwords())