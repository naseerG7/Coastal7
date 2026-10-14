import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const customerEmail = "naseer3@example.com";
const customerPassword = "Customer@123";

async function login(page: any) {
  await page.goto("/customer/login");

  await expect(
    page.getByRole("heading", { name: "Customer Login" })
  ).toBeVisible();

  await page
    .getByPlaceholder("Email")
    .fill(customerEmail);

  await page
    .getByPlaceholder("Password")
    .fill(customerPassword);

  await page
    .getByRole("button", {
      name: "Customer Login",
    })
    .click();

  await expect(page).toHaveURL(/\/products$/, {
    timeout: 15000,
  });
}

async function clearCart(page: any) {
  await page.goto("/cart");

  await expect(
    page.getByRole("heading", {
      name: /shopping cart|your cart is empty/i,
    })
  ).toBeVisible({
    timeout: 10000,
  });

  while (true) {
    const removeButtons = page.locator(
      ".cart-remove-button"
    );

    const count = await removeButtons.count();

    if (count === 0) {
      break;
    }

    await removeButtons.first().click();

    await page.waitForTimeout(500);
  }

  await page.reload();

  await expect(
    page.locator(".cart-item")
  ).toHaveCount(0, {
    timeout: 10000,
  });
}

async function addFirstProduct(page: any) {
  await page.goto("/products");

  const firstProduct = page.locator(
    ".product-card"
  ).first();

  await expect(firstProduct).toBeVisible();

  await firstProduct
    .getByRole("link", {
      name: /view details/i,
    })
    .click();

  await expect(page).toHaveURL(
    /\/products\/\d+$/
  );

  const addButton = page.locator(
    ".product-add-cart-button"
  );

  await expect(addButton).toBeVisible();
  await expect(addButton).toBeEnabled();

  const responsePromise =
    page.waitForResponse(
      (response) =>
        response.url().includes("/cart/items") &&
        response.request().method() === "POST"
    );

  await addButton.click();

  const response =
    await responsePromise;

  expect(
    response.status(),
    `Add-to-cart API failed: ${await response.text()}`
  ).toBe(200);

  await expect(
    page.getByText(/added to your cart/i)
  ).toBeVisible({
    timeout: 10000,
  });
}

async function prepareCheckout(page: any) {
  await login(page);

  await clearCart(page);

  await addFirstProduct(page);

  await page.goto("/checkout");

  await expect(
    page.getByRole("heading", {
      name: "Checkout",
    })
  ).toBeVisible({
    timeout: 10000,
  });
}


/*
|--------------------------------------------------------------------------
| TEST 1
|--------------------------------------------------------------------------
*/

test("authenticated customer can open checkout", async ({
  page,
}) => {
  await prepareCheckout(page);

  await expect(
    page.getByRole("heading", {
      name: "Delivery Address",
    })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "Payment Method",
    })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "Review Your Order",
    })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "Order Summary",
    })
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: /Place Order/i,
    })
  ).toBeVisible();
});


/*
|--------------------------------------------------------------------------
| TEST 2
|--------------------------------------------------------------------------
*/

test("checkout validates required delivery information", async ({
  page,
}) => {
  await prepareCheckout(page);

  // Do not enter any address information.
  await page
    .getByRole("button", {
      name: /Place Order/i,
    })
    .click();

  await expect(
    page.locator(".checkout-error-message")
  ).toBeVisible();

  await expect(
    page.locator(".checkout-error-message")
  ).toContainText(
    "Please enter your full name."
  );

  // Confirm we remain on checkout.
  await expect(page).toHaveURL(
    /\/checkout$/
  );
});


/*
|--------------------------------------------------------------------------
| TEST 3
|--------------------------------------------------------------------------
*/

test("customer can select Cash on Delivery", async ({
  page,
}) => {
  await prepareCheckout(page);

  const codRadio =
    page.locator(
      'input[name="payment"][value="cod"]'
    );

  await expect(codRadio).toBeVisible();

  await expect(codRadio).toBeChecked();

  // Select UPI first.
  await page
    .locator(
      'input[name="payment"][value="upi"]'
    )
    .check();

  await expect(
    page.locator(
      'input[name="payment"][value="upi"]'
    )
  ).toBeChecked();

  // Select Cash on Delivery again.
  await codRadio.check();

  await expect(codRadio).toBeChecked();

  // Checkout summary should reflect COD.
  const paymentSummary =
    page.locator(".checkout-side-card").filter({
      hasText: "Payment",
    });

  await expect(paymentSummary).toContainText(
    "Cash on Delivery"
  );
});


/*
|--------------------------------------------------------------------------
| TEST 4
|--------------------------------------------------------------------------
*/

test("customer can successfully place an order with Cash on Delivery", async ({
  page,
}) => {
  await prepareCheckout(page);

  // Fill delivery address.
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

  // Confirm Cash on Delivery.
  await page
    .locator(
      'input[name="payment"][value="cod"]'
    )
    .check();

  await expect(
    page
      .locator(
        'input[name="payment"][value="cod"]'
      )
  ).toBeChecked();

  // Wait for the actual order API.
  const orderResponsePromise =
    page.waitForResponse(
      (response) =>
        response.url().includes("/orders") &&
        response.request().method() === "POST"
    );

  await page
    .getByRole("button", {
      name: /Place Order/i,
    })
    .click();

  const orderResponse =
    await orderResponsePromise;

  expect(
    orderResponse.status(),
    `Create order API failed: ${await orderResponse.text()}`
  ).toBe(200);

  // Verify successful checkout screen.
  await expect(
    page.getByRole("heading", {
      name: "Order placed successfully!",
    })
  ).toBeVisible({
    timeout: 15000,
  });

  await expect(
    page.getByText("Order ID")
  ).toBeVisible();

  await expect(
    page.getByText("Cash on Delivery")
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: "View My Orders",
    })
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: "Continue Shopping",
    })
  ).toBeVisible();
});