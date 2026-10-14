import { test, expect } from "@playwright/test";

test("customer can login successfully", async ({ page }) => {
  await page.goto("/customer/login");

  // Verify customer login page
  await expect(
    page.getByRole("heading", { name: "Customer Login" })
  ).toBeVisible();

  // Enter confirmed customer credentials
  await page
    .getByPlaceholder("Email")
    .fill("naseer2@example.com");

  await page
    .getByPlaceholder("Password")
    .fill("Customer@123");

  // Submit login
  await page
    .getByRole("button", { name: "Customer Login" })
    .click();

  // Customer should be redirected to products
  await expect(page).toHaveURL(/\/products$/);

  // Verify products page loaded
  await expect(
    page.getByRole("heading", { name: /products/i })
  ).toBeVisible();
});