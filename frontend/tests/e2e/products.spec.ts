import { test, expect } from "@playwright/test";

test("products page loads successfully", async ({ page }) => {
  await page.goto("/products");

  await expect(
    page.getByRole("heading", { name: /products/i })
  ).toBeVisible();
});
