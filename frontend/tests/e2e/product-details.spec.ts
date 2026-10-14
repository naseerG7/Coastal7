import { test, expect } from "@playwright/test";

test("product details page loads successfully", async ({ page }) => {
  await page.goto("/products");

  await expect(
    page.getByRole("heading", { name: /products/i })
  ).toBeVisible();

  const firstProduct = page.locator(".product-card").first();

  await expect(firstProduct).toBeVisible();

  await firstProduct
    .getByRole("link", { name: /view details/i })
    .click();

  await expect(page).toHaveURL(/\/products\/\d+$/);

  await expect(
    page.locator(".product-add-cart-button")
  ).toBeVisible();
});

test("product details displays product information", async ({ page }) => {
  await page.goto("/products");

  const firstProduct = page.locator(".product-card").first();

  await firstProduct
    .getByRole("link", { name: /view details/i })
    .click();

  await expect(page).toHaveURL(/\/products\/\d+$/);

  await expect(
    page.locator(".product-details-title")
  ).toBeVisible();

  await expect(
    page.locator(".product-details-price")
  ).toBeVisible();

  await expect(
    page.locator(".product-description-section")
  ).toBeVisible();

  await expect(
    page.locator(".product-details-category")
  ).toBeVisible();

  await expect(
    page.locator(".product-stock-section")
  ).toBeVisible();
});

test("customer can add product to cart from product details", async ({
  page,
}) => {
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

  const firstProduct = page.locator(".product-card").first();

  await expect(firstProduct).toBeVisible();

  await firstProduct
    .getByRole("link", { name: /view details/i })
    .click();

  await expect(page).toHaveURL(/\/products\/\d+$/);

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

  await expect(
    page.getByText(/added to your cart/i)
  ).toBeVisible({
    timeout: 10000,
  });
});