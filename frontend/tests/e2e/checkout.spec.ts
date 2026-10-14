import { test, expect } from "@playwright/test";

test("customer can complete checkout and place an order", async ({
  page,
}) => {
  // =========================================================
  // 1. Open customer login
  // =========================================================

  await page.goto("/customer/login");

  await expect(
    page.getByRole("heading", { name: "Customer Login" })
  ).toBeVisible();

  // =========================================================
  // 2. Fill credentials and log in
  // =========================================================

  await page
    .getByPlaceholder("Email")
    .fill("naseer2@example.com");

  await page
    .getByPlaceholder("Password")
    .fill("Customer@123");

  // Start listening before clicking the login button.
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/auth/login") &&
      response.request().method() === "POST"
  );

  await page
    .getByRole("button", { name: "Customer Login" })
    .click();

  const loginResponse = await loginResponsePromise;

  // Temporary diagnostics to help identify login failures.
  console.log("Login status:", loginResponse.status());
  console.log("Login response:", await loginResponse.text());

  // =========================================================
  // 3. Verify login
  // =========================================================

  await expect(page).toHaveURL(/\/products$/);

  await expect(
    page.getByRole("heading", { name: /products/i })
  ).toBeVisible();

  // =========================================================
  // 4. Select the first product
  // =========================================================

  const firstProduct = page
    .locator(".product-card")
    .first();

  await expect(firstProduct).toBeVisible();

  // =========================================================
  // 5. Open product details
  // =========================================================

  await firstProduct
    .getByRole("link", { name: /view details/i })
    .click();

  await expect(page).toHaveURL(/\/products\/\d+$/);

  // =========================================================
  // 6. Add product to cart
  // =========================================================

  const addToCartButton = page.locator(
    ".product-add-cart-button"
  );

  await expect(addToCartButton).toBeVisible();
  await expect(addToCartButton).toBeEnabled();

  await addToCartButton.click();

  // =========================================================
  // 7. Verify product added
  // =========================================================

  await expect(
    page.getByText(/added to your cart/i)
  ).toBeVisible();

  // =========================================================
  // 8. Open cart
  // =========================================================

  await page
    .locator(".details-cart-button")
    .click();

  await expect(page).toHaveURL(/\/cart$/);

  // =========================================================
  // 9. Open checkout
  // =========================================================

  await page
    .getByRole("button", { name: "Proceed to Buy" })
    .click();

  await expect(page).toHaveURL(/\/checkout$/);

  // =========================================================
  // 10. Verify checkout page
  // =========================================================

  await expect(
    page.getByRole("heading", { name: "Checkout" })
  ).toBeVisible();

  await expect(
    page.getByText("Delivery Address")
  ).toBeVisible();

  await expect(
    page.getByText("Payment Method")
  ).toBeVisible();

  await expect(
    page.getByText("Review Your Order")
  ).toBeVisible();

  // =========================================================
  // 11. Fill delivery address
  // =========================================================

  await page
    .locator('input[name="fullName"]')
    .fill("Naseer Ahmed");

  await page
    .locator('input[name="phone"]')
    .fill("9876543210");

  await page
    .locator('textarea[name="addressLine"]')
    .fill("House 123, Main Road");

  await page
    .locator('input[name="city"]')
    .fill("Guntur");

  await page
    .locator('input[name="state"]')
    .fill("Andhra Pradesh");

  await page
    .locator('input[name="pincode"]')
    .fill("522001");

  // =========================================================
  // 12. Verify Cash on Delivery
  // =========================================================

  const codPayment = page.locator(
    'input[name="payment"][value="cod"]'
  );

  await expect(codPayment).toBeChecked();

  // =========================================================
  // 13. Place order
  // =========================================================

  const placeOrderButton = page.locator(
    ".place-order-button"
  );

  await expect(placeOrderButton).toBeVisible();
  await expect(placeOrderButton).toBeEnabled();

  await placeOrderButton.click();

  // =========================================================
  // 14. Verify order success
  // =========================================================

  await expect(
    page.getByRole("heading", {
      name: "Order placed successfully!",
    })
  ).toBeVisible();

  // =========================================================
  // 15. Verify order information
  // =========================================================

  await expect(
    page.getByText("Order ID")
  ).toBeVisible();

  await expect(
    page.getByText("Delivery to")
  ).toBeVisible();

  await expect(
    page.getByText("Naseer Ahmed")
  ).toBeVisible();

  await expect(
    page.getByText("Guntur")
  ).toBeVisible();

  await expect(
    page.getByText("Andhra Pradesh")
  ).toBeVisible();

  await expect(
    page.getByText("Cash on Delivery")
  ).toBeVisible();

  // =========================================================
  // 16. Verify View My Orders button
  // =========================================================

  await expect(
    page.getByRole("button", {
      name: "View My Orders",
    })
  ).toBeVisible();
});