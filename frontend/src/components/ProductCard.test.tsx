import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductCard from "./ProductCard";
import { addToCart } from "../services/cartService";
import type { Product } from "../types/products";

vi.mock("../services/cartService", () => ({
  addToCart: vi.fn(),
}));

const mockProduct: Product = {
  id: 1,
  name: "Test Wireless Headphones",
  category: "Electronics",
  description: "Test product description",
  price: 2999,
  stock: 20,
  image_url: null,
};

describe("ProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the product information correctly", () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    expect(
      screen.getByText("Test Wireless Headphones")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Electronics")
    ).toBeInTheDocument();

    expect(
      screen.getByText("₹2,999")
    ).toBeInTheDocument();

    expect(
      screen.getByText("20 available")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /add to cart/i,
      })
    ).toBeInTheDocument();
  });

  it("adds the product to the cart when clicked", async () => {
    const user = userEvent.setup();

    vi.mocked(addToCart).mockResolvedValue({
      message: "Added to cart",
    } as never);

    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    const addToCartButton = screen.getByRole("button", {
      name: /add to cart/i,
    });

    await user.click(addToCartButton);

    await waitFor(() => {
      expect(addToCart).toHaveBeenCalledWith(1, 1);
    });

    expect(
      screen.getByText(/added to cart/i)
    ).toBeInTheDocument();
  });

  it("disables Add to Cart when the product is out of stock", () => {
    const outOfStockProduct: Product = {
      ...mockProduct,
      stock: 0,
    };

    render(
      <MemoryRouter>
        <ProductCard product={outOfStockProduct} />
      </MemoryRouter>
    );

    const addToCartButton = screen.getByRole("button", {
      name: /add to cart/i,
    });

    expect(addToCartButton).toBeDisabled();

    expect(
      screen.getByText("Out of Stock")
    ).toBeInTheDocument();
  });
});