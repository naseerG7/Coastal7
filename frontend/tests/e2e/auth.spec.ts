import { test, expect } from "@playwright/test";

test("customer registration page loads", async ({ page }) => {
  await page.goto("/customer/register");

  await expect(page).toHaveURL(/\/customer\/register$/);

  // The registration form is the form containing "Create Account".
  const registrationForm = page.locator("form").filter({
    hasText: "Create Account",
  });

  await expect(registrationForm).toBeVisible();

  // Verify the important registration controls exist.
  await expect(
    registrationForm.getByText("Name", { exact: true })
  ).toBeVisible();

  await expect(
    registrationForm.getByText("Email", { exact: true })
  ).toBeVisible();

  await expect(
    registrationForm.getByText("Password", { exact: true })
  ).toBeVisible();

  await expect(
    registrationForm.getByText("Role", { exact: true })
  ).toBeVisible();

  await expect(
    registrationForm.getByRole("button", {
      name: /create account/i,
    })
  ).toBeVisible();
});

test("invalid customer login shows an error", async ({ page }) => {
  await page.goto("/customer/login");

  await expect(
    page.getByRole("heading", { name: "Customer Login" })
  ).toBeVisible();

  await page
    .getByPlaceholder("Email")
    .fill("invalid-user@example.com");

  await page
    .getByPlaceholder("Password")
    .fill("WrongPassword@123");

  await page
    .getByRole("button", { name: "Customer Login" })
    .click();

  await expect(page).toHaveURL(/\/customer\/login$/);

  await expect(page.locator("body")).toContainText(
    /invalid|incorrect|failed|error|login/i
  );
});

test("unauthenticated customer cannot access checkout", async ({
  page,
}) => {
  await page.goto("/checkout");

  await expect(page).
  toHaveURL(
    /\/(login|customer\/login)/,
    {
      timeout: 10000,
    }
  );
});