import { test, expect } from "@playwright/test";

test("customer can add a product to cart repeatedly", async ({ page }) => {
  // 1. Login
  await page.goto("/customer/login");

  await expect(
    page.getByRole("heading", { name: "Customer Login" })
  ).toBeVisible();

  await page
    .getByPlaceholder("Email")
    .fill("naseer3@example.com");

  await page
    .getByPlaceholder("Password")
    .fill("Customer@123");

  await page
    .getByRole("button", { name: "Customer Login" })
    .click();

  await expect(page).toHaveURL(/\/products$/, {
    timeout: 15000,
  });

  // 2. Go to cart
  await page.goto("/cart");

  await expect(
    page.getByRole("heading", { name: /shopping cart/i })
  ).toBeVisible();

  // 3. Remove existing cart items
  while (true) {
    const removeButtons = page.locator(".cart-remove-button");
    const count = await removeButtons.count();

    if (count === 0) {
      break;
    }

    await removeButtons.first().click();

    await page.waitForTimeout(1000);
  }

  // 4. Reload cart so React gets the latest backend state
  await page.reload();

  // 5. Confirm there are no cart items
  await expect(
    page.locator(".cart-item")
  ).toHaveCount(0, {
    timeout: 10000,
  });

  // 6. Go to products
  await page.goto("/products");

  await expect(
    page.getByRole("heading", { name: /products/i })
  ).toBeVisible();

  // 7. Open first product
  const firstProduct = page.locator(".product-card").first();

  await expect(firstProduct).toBeVisible();

  await firstProduct
    .getByRole("link", { name: /view details/i })
    .click();

  await expect(page).toHaveURL(/\/products\/\d+$/);

  // 8. Add product to cart
  const addButton = page.locator(".product-add-cart-button");

  await expect(addButton).toBeVisible();
  await expect(addButton).toBeEnabled();

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/cart/items") &&
      response.request().method() === "POST"
  );

  await addButton.click();

  const response = await responsePromise;

  expect(
    response.status(),
    `Add-to-cart API failed: ${await response.text()}`
  ).toBe(200);

  // 9. Confirm successful add
  await expect(
    page.getByText(/added to your cart/i)
  ).toBeVisible({
    timeout: 10000,
  });

  // 10. Open cart
  await page.locator(".details-cart-button").click();

  await expect(page).toHaveURL(/\/cart$/);

  await expect(
    page.getByRole("heading", { name: /shopping cart/i })
  ).toBeVisible();

  // 11. Confirm exactly one item
  await expect(
    page.locator(".cart-item")
  ).toHaveCount(1);

  await expect(
    page.locator(".cart-item-name").first()
  ).toBeVisible();
});