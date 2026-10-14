import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const customerEmail = "naseer3@example.com";
const customerPassword = "Customer@123";

// Login helper with API diagnostics
async function login(page: any) {
  await page.goto("/customer/login");

  await expect(
    page.getByRole("heading", {
      name: "Customer Login",
    })
  ).toBeVisible();

  await page.getByPlaceholder("Email").fill(customerEmail);
  await page.getByPlaceholder("Password").fill(customerPassword);

  // Capture the backend login request before clicking the button.
  const loginResponsePromise = page.waitForResponse(
    (response: any) =>
      response.url().includes("/auth/login") &&
      response.request().method() === "POST",
    { timeout: 15000 }
  );

  await page
    .getByRole("button", {
      name: "Customer Login",
    })
    .click();

  const response = await loginResponsePromise;

  console.log("====================================");
  console.log("CUSTOMER LOGIN DIAGNOSTICS");
  console.log("Email:", customerEmail);
  console.log("Login API URL:", response.url());
  console.log("HTTP status:", response.status());

  let responseBody = "";

  try {
    responseBody = await response.text();
    console.log("Response body:", responseBody);
  } catch {
    console.log("Could not read the response body.");
  }

  console.log("====================================");

  // Fail with a clear message if the API rejects the login.
  expect(
    response.status(),
    `Login API failed. HTTP ${response.status()}. Response: ${responseBody}`
  ).toBe(200);

  // Verify the application redirects after successful authentication.
  await expect(page).toHaveURL(/\/products\/?$/, {
    timeout: 15000,
  });
}

test("customer can logout successfully", async ({ page }) => {
  await login(page);

  // Verify the customer reaches the products page.
  await expect(page).toHaveURL(/\/products\/?$/);

  // Find and click the logout control.
  const logoutButton = page.getByRole("button", {
    name: /logout|log out|sign out/i,
  });

  await expect(logoutButton).toBeVisible();
  await logoutButton.click();

  // Verify logout returns the customer to the login page.
  await expect(page).toHaveURL(/\/customer\/login\/?$/, {
    timeout: 10000,
  });
});