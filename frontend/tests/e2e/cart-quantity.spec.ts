import { test, expect, type Response } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const customerEmail = "naseer3@example.com";
const customerPassword = "Customer@123";

async function login(page: any) {
  await page.goto("/customer/login");

  await expect(
    page.getByRole("heading", { name: "Customer Login" })
  ).toBeVisible();

  await page.getByPlaceholder("Email").fill(customerEmail);

  await page.getByPlaceholder("Password").fill(customerPassword);

  await page
    .getByRole("button", { name: "Customer Login" })
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

  const removeButtons = page.locator(".cart-remove-button");

  while ((await removeButtons.count()) > 0) {
    const firstRemoveButton = removeButtons.first();

    // Wait until the remove button is ready to be clicked.
    await expect(firstRemoveButton).toBeEnabled({
      timeout: 10000,
    });

    // Wait for the DELETE request before clicking.
    const deleteResponsePromise = page.waitForResponse(
      (response: Response) =>
        response.url().includes("/cart/items/") &&
        response.request().method() === "DELETE"
    );

    await firstRemoveButton.click();

    const deleteResponse = await deleteResponsePromise;

    expect(
      deleteResponse.status(),
      `Remove cart item API failed: ${await deleteResponse.text()}`
    ).toBe(200);

    // Wait until the item has actually disappeared from the cart.
    await expect(firstRemoveButton).toBeHidden({
      timeout: 10000,
    });
  }

  // Final verification that the cart is empty.
  await expect(page.locator(".cart-item")).toHaveCount(0, {
    timeout: 10000,
  });

  await expect(
    page.getByRole("heading", {
      name: "Your Cart is Empty",
    })
  ).toBeVisible({
    timeout: 10000,
  });
}

async function addFirstProduct(page: any) {
  await page.goto("/products");

  const firstProduct = page.locator(".product-card").first();

  await expect(firstProduct).toBeVisible();

  await firstProduct
    .getByRole("link", { name: /view details/i })
    .click();

  await expect(page).toHaveURL(/\/products\/\d+$/, {
    timeout: 10000,
  });

  const addButton = page.locator(".product-add-cart-button");

  await expect(addButton).toBeVisible();

  await expect(addButton).toBeEnabled();

  const responsePromise = page.waitForResponse(
    (response: Response) =>
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

  await page.goto("/cart");

  await expect(
    page.getByRole("heading", {
      name: "Shopping Cart",
    })
  ).toBeVisible();

  await expect(
    page.locator(".cart-item").first()
  ).toBeVisible();
}

test("customer can increase cart item quantity", async ({ page }) => {
  await login(page);

  // Start with a clean backend cart.
  await clearCart(page);

  // Add exactly one product.
  await addFirstProduct(page);

  const cartItem = page.locator(".cart-item").first();

  const quantityControls =
    cartItem.locator(".quantity-controls");

  const increaseButton =
    quantityControls.getByRole("button", {
      name: "Increase quantity",
    });

  const quantity =
    quantityControls.locator("span");

  await expect(quantity).toHaveText("1");

  const responsePromise =
    page.waitForResponse(
      (response) =>
        response.url().includes("/cart/items/") &&
        response.request().method() === "PUT"
    );

  await increaseButton.click();

  const response =
    await responsePromise;

  expect(
    response.status(),
    `Increase quantity API failed: ${await response.text()}`
  ).toBe(200);

  await expect(quantity).toHaveText("2", {
    timeout: 10000,
  });
});

test("customer can decrease cart item quantity", async ({ page }) => {
  await login(page);

  // Start with a clean backend cart.
  await clearCart(page);

  // Add exactly one product.
  await addFirstProduct(page);

  const cartItem = page.locator(".cart-item").first();

  const quantityControls =
    cartItem.locator(".quantity-controls");

  const increaseButton =
    quantityControls.getByRole("button", {
      name: "Increase quantity",
    });

  const decreaseButton =
    quantityControls.getByRole("button", {
      name: "Decrease quantity",
    });

  const quantity =
    quantityControls.locator("span");

  // Start at quantity 1.
  await expect(quantity).toHaveText("1");

  // Increase to 2 first.
  const increaseResponsePromise =
    page.waitForResponse(
      (response) =>
        response.url().includes("/cart/items/") &&
        response.request().method() === "PUT"
    );

  await increaseButton.click();

  const increaseResponse =
    await increaseResponsePromise;

  expect(
    increaseResponse.status(),
    `Increase quantity API failed: ${await increaseResponse.text()}`
  ).toBe(200);

  await expect(quantity).toHaveText("2", {
    timeout: 10000,
  });

  // Decrease back to 1.
  const decreaseResponsePromise =
    page.waitForResponse(
      (response) =>
        response.url().includes("/cart/items/") &&
        response.request().method() === "PUT"
    );

  await decreaseButton.click();

  const decreaseResponse =
    await decreaseResponsePromise;

  expect(
    decreaseResponse.status(),
    `Decrease quantity API failed: ${await decreaseResponse.text()}`
  ).toBe(200);

  await expect(quantity).toHaveText("1", {
    timeout: 10000,
  });
});

test("customer can remove an item from cart", async ({ page }) => {
  await login(page);

  // Start with a clean backend cart.
  await clearCart(page);

  // Add exactly one product.
  await addFirstProduct(page);

  const cartItem =
    page.locator(".cart-item").first();

  await expect(cartItem).toBeVisible();

  const removeButton =
    cartItem.getByRole("button", {
      name: /remove/i,
    });

  await expect(removeButton).toBeVisible();

  await expect(removeButton).toBeEnabled();

  const deleteResponsePromise =
    page.waitForResponse(
      (response) =>
        response.url().includes("/cart/items/") &&
        response.request().method() === "DELETE"
    );

  await removeButton.click();

  const deleteResponse =
    await deleteResponsePromise;

  expect(
    deleteResponse.status(),
    `Remove cart item API failed: ${await deleteResponse.text()}`
  ).toBe(200);

  await expect(
    page.locator(".cart-item")
  ).toHaveCount(0, {
    timeout: 10000,
  });

  await expect(
    page.getByRole("heading", {
      name: "Your Cart is Empty",
    })
  ).toBeVisible({
    timeout: 10000,
  });
});