import { test, expect } from "@playwright/test";

test.describe("ShopFlow AI chatbot", () => {
  test("opens the chatbot and displays the welcome message", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("button", { name: "Open ShopFlow AI" })
      .click();

    await expect(
      page.getByRole("region", { name: "ShopFlow AI chat" })
    ).toBeVisible();

    await expect(
      page.getByText(
        "Hi! I'm ShopFlow AI. Ask me about shopping or our products."
      )
    ).toBeVisible();
  });

  test("closes the chatbot when the close button is clicked", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("button", { name: "Open ShopFlow AI" })
      .click();

    await expect(
      page.getByRole("region", { name: "ShopFlow AI chat" })
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Close chat" })
      .click();

    await expect(
      page.getByRole("region", { name: "ShopFlow AI chat" })
    ).toBeHidden();
  });

  test("asks the customer to log in when no token exists", async ({
    page,
  }) => {
    await page.goto("/");

    await page.evaluate(() => {
      localStorage.removeItem("access_token");
    });

    await page
      .getByRole("button", { name: "Open ShopFlow AI" })
      .click();

    await page
      .getByRole("textbox", { name: "Your message" })
      .fill("Recommend a laptop");

    await page
      .getByRole("button", { name: "Send" })
      .click();

    await expect(
      page.getByText(
        "Please log in to ShopFlow before using the AI assistant."
      )
    ).toBeVisible();
  });

  test("displays a streamed AI reply", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => {
    localStorage.setItem("access_token", "playwright-test-token");
  });

  await page.route("**/ai/chat/stream", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        "data: Hello ",
        "",
        "data: from ShopFlow AI!",
        "",
        "event: done",
        "data: [DONE]",
        "",
        "",
      ].join("\n"),
    });
  });

  await page
    .getByRole("button", { name: "Open ShopFlow AI" })
    .click();

  await page
    .getByRole("textbox", { name: "Your message" })
    .fill("Hello");

  await page
    .getByRole("button", { name: "Send" })
    .click();

  await expect(
    page.locator(".chatbot-message.assistant").filter({
      hasText: "Hello from ShopFlow AI!",
    })
  ).toBeVisible();
});

  test("displays an error when the AI service returns HTTP 503", async ({
    page,
  }) => {
    await page.goto("/");

    await page.evaluate(() => {
      localStorage.setItem("access_token", "playwright-test-token");
    });

    await page.route("**/ai/chat/stream", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          detail: "The AI service is temporarily unavailable.",
        }),
      });
    });

    await page
      .getByRole("button", { name: "Open ShopFlow AI" })
      .click();

    await page
      .getByRole("textbox", { name: "Your message" })
      .fill("Recommend a laptop");

    await page
      .getByRole("button", { name: "Send" })
      .click();

    await expect(
      page.locator(".chatbot-message.assistant").filter({
        hasText: "AI request failed (503)",
      })
    ).toBeVisible();
  });
});

  test("displays real product data in a recommendation card", async ({
    page,
  }) => {
    await page.goto("/");

    await page.evaluate(() => {
      localStorage.setItem("access_token", "playwright-test-token");
    });

    // Mock the live product API with predictable test data.
    await page.route("**/products/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: 9001,
            name: "Demo Laptop",
            category: "Electronics",
            price: 79999,
            stock: 12,
            image_url: "/uploads/products/demo-laptop.jpg",
          },
        ]),
      });
    });

    // Mock the AI streaming endpoint.
    await page.route("**/ai/chat/stream", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "text/event-stream",
    body: [
      "event: sources",
      `data: ${JSON.stringify([
        {
          id: 9001,
          name: "Demo Laptop",
          category: "Electronics",
          price: "79999.00",
          stock: 12,
          image_url: "/uploads/products/demo-laptop.jpg",
        },
      ])}`,
      "",
      "data: Here is a laptop recommendation.",
      "",
      "event: done",
      "data: [DONE]",
      "",
      "",
    ].join("\n"),
  });
});

    await page
      .getByRole("button", { name: "Open ShopFlow AI" })
      .click();

    await page
      .getByRole("textbox", { name: "Your message" })
      .fill("Recommend a laptop");

    await page
      .getByRole("button", { name: "Send" })
      .click();

    const productCard = page.locator(".chatbot-product-card");

    await expect(productCard).toBeVisible();
    await expect(productCard.getByText("Demo Laptop")).toBeVisible();
    await expect(productCard.getByText("₹79,999")).toBeVisible();
    await expect(productCard.getByText("12 available")).toBeVisible();

    await expect(
      productCard.getByRole("link").first()
    ).toHaveAttribute("href", "/products/9001");

    await expect(
      productCard.getByRole("button", { name: "Add to cart" })
    ).toBeEnabled();
  });
