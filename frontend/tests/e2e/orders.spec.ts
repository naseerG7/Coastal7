import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const customerEmail = "naseer3@example.com";
const customerPassword = "Customer@123";

// ============================================================
// LOGIN
// ============================================================

async function login(page: any) {
  await page.goto("/customer/login");

  await expect(
    page.getByRole("heading", {
      name: "Customer Login",
    })
  ).toBeVisible();

  await page.getByPlaceholder("Email").fill(customerEmail);
  await page.getByPlaceholder("Password").fill(customerPassword);

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
  console.log("ORDERS TEST LOGIN DIAGNOSTICS");
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

  expect(
    response.status(),
    `Login API failed. HTTP ${response.status()}. Response: ${responseBody}`
  ).toBe(200);

  await expect(page).toHaveURL(/\/products\/?$/, {
    timeout: 15000,
  });
}

// ============================================================
// CLEAR CART
// ============================================================

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
    const removeButtons =
      page.locator(".cart-remove-button");

    const count =
      await removeButtons.count();

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


// ============================================================
// ADD FIRST PRODUCT
// ============================================================

async function addFirstProduct(page: any) {
  await page.goto("/products");

  await expect(
    page.getByRole("heading", {
      name: /products/i,
    })
  ).toBeVisible();

  const firstProduct =
    page.locator(".product-card").first();

  await expect(
    firstProduct
  ).toBeVisible();

  await firstProduct
    .getByRole("link", {
      name: /view details/i,
    })
    .click();

  await expect(page).toHaveURL(
    /\/products\/\d+$/
  );

  const addButton =
    page.locator(
      ".product-add-cart-button"
    );

  await expect(
    addButton
  ).toBeVisible();

  await expect(
    addButton
  ).toBeEnabled();

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


// ============================================================
// PLACE ORDER
// ============================================================

async function placeOrder(page: any) {
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


  // ----------------------------------------------------------
  // DELIVERY INFORMATION
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // PAYMENT
  // ----------------------------------------------------------

  const codRadio =
    page.locator(
      'input[name="payment"][value="cod"]'
    );

  await codRadio.check();

  await expect(
    codRadio
  ).toBeChecked();


  // ----------------------------------------------------------
  // CREATE ORDER
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // EXTRACT ORDER ID
  // ----------------------------------------------------------

  const orderIdText =
    await page
      .getByText("Order ID")
      .locator("..")
      .innerText();

  const match =
    orderIdText.match(/#(\d+)/);

  expect(
    match,
    `Could not find order ID in: ${orderIdText}`
  ).not.toBeNull();

  return Number(match![1]);
}


// ============================================================
// TEST 1
// CUSTOMER CAN OPEN MY ORDERS PAGE
// ============================================================

test(
  "customer can open My Orders page",
  async ({ page }) => {
    await login(page);

    await page.goto("/orders");

    await expect(
      page.getByRole("heading", {
        name: /My Orders/i,
      })
    ).toBeVisible({
      timeout: 15000,
    });

    await expect(
      page.getByText("SHOPFLOW ACCOUNT")
    ).toBeVisible();

    await expect(
      page.getByRole("link", {
        name: "Continue Shopping",
      })
    ).toBeVisible();
  }
);


// ============================================================
// TEST 2
// NEW ORDER APPEARS IN MY ORDERS
// ============================================================

test(
  "newly placed order appears in My Orders",
  async ({ page }) => {
    const orderId =
      await placeOrder(page);

    await page.goto("/orders");

    await expect(
      page.getByRole("heading", {
        name: /My Orders/i,
      })
    ).toBeVisible({
      timeout: 15000,
    });


    // --------------------------------------------------------
    // FIND ORDER CARD
    // --------------------------------------------------------

    const orderCard =
      page.locator(".order-card").filter({
        hasText: `#${orderId}`,
      });

    await expect(
      orderCard
    ).toBeVisible({
      timeout: 15000,
    });


    // --------------------------------------------------------
    // VERIFY STATUS
    // --------------------------------------------------------

    const orderStatus =
      orderCard.locator(
        ".order-card-status"
      );

    await expect(
      orderStatus
    ).toBeVisible();

    await expect(
      orderStatus
    ).toContainText(
      /Pending|Confirmed|Processing/i
    );


    // --------------------------------------------------------
    // VERIFY ITEMS LABEL
    //
    // The card contains both:
    // <small>Items</small>
    // and
    // <h3>Items</h3>
    //
    // Therefore target the small element specifically.
    // --------------------------------------------------------

    const itemsLabel =
      orderCard
        .locator("small")
        .filter({
          hasText: "Items",
        });

    await expect(
      itemsLabel
    ).toBeVisible();


    // --------------------------------------------------------
    // VERIFY TOTAL LABEL
    // --------------------------------------------------------

    const totalLabel =
      orderCard
        .locator("small")
        .filter({
          hasText: "Total",
        });

    await expect(
      totalLabel
    ).toBeVisible();


    // --------------------------------------------------------
    // VERIFY VIEW ORDER
    // --------------------------------------------------------

    await expect(
      orderCard.getByRole("link", {
        name: "View Order",
      })
    ).toBeVisible();
  }
);


// ============================================================
// TEST 3
// CUSTOMER CAN OPEN ORDER DETAILS
// ============================================================

test(
  "customer can open order details",
  async ({ page }) => {
    const orderId =
      await placeOrder(page);

    await page.goto("/orders");

    await expect(
      page.getByRole("heading", {
        name: /My Orders/i,
      })
    ).toBeVisible({
      timeout: 15000,
    });


    // --------------------------------------------------------
    // FIND ORDER
    // --------------------------------------------------------

    const orderCard =
      page.locator(".order-card").filter({
        hasText: `#${orderId}`,
      });

    await expect(
      orderCard
    ).toBeVisible({
      timeout: 15000,
    });


    // --------------------------------------------------------
    // OPEN ORDER
    // --------------------------------------------------------

    await orderCard
      .getByRole("link", {
        name: "View Order",
      })
      .click();


    // --------------------------------------------------------
    // VERIFY URL
    // --------------------------------------------------------

    await expect(page).toHaveURL(
      new RegExp(`/orders/${orderId}$`)
    );


    // --------------------------------------------------------
    // VERIFY DETAIL CARD
    // --------------------------------------------------------

    await expect(
      page.locator(".order-detail-card")
    ).toBeVisible({
      timeout: 15000,
    });


    // --------------------------------------------------------
    // VERIFY ORDER NUMBER
    // --------------------------------------------------------

    await expect(
      page.getByRole("heading", {
        name: `Order #${orderId}`,
      })
    ).toBeVisible();


    // --------------------------------------------------------
    // ORDER DETAILS
    // --------------------------------------------------------

    await expect(
      page.getByText("ORDER DETAILS", {
        exact: true,
      })
    ).toBeVisible();


    // --------------------------------------------------------
    // ORDER TRACKING
    // --------------------------------------------------------

    await expect(
      page.getByText("ORDER TRACKING", {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "Track your order",
      })
    ).toBeVisible();


    // --------------------------------------------------------
    // VERIFY ACTUAL ORDER STATUS
    // --------------------------------------------------------

    const detailStatus =
      page.locator(
        ".order-detail-header .order-status"
      );

    await expect(
      detailStatus
    ).toBeVisible();

    await expect(
      detailStatus
    ).toContainText(
      /Pending|Confirmed|Processing/i
    );


    // --------------------------------------------------------
    // PRODUCTS
    // --------------------------------------------------------

    await expect(
      page.getByRole("heading", {
        name: "Products",
      })
    ).toBeVisible();


    // --------------------------------------------------------
    // ORDER ITEM
    // --------------------------------------------------------

    await expect(
      page.locator(
        ".order-detail-item"
      ).first()
    ).toBeVisible();


    // --------------------------------------------------------
    // PRICE BREAKDOWN
    // --------------------------------------------------------

    await expect(
      page.getByRole("heading", {
        name: "Price Breakdown",
      })
    ).toBeVisible();
  }
);