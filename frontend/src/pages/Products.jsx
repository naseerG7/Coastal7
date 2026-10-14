import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getProducts } from "../services/productService";
import ProductCard from "../components/ProductCard";

const CATEGORIES = [
  "Mobiles",
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Gaming",
];

const PRICE_RANGES = {
  Mobiles: [
    {
      label: "Under ₹10,000",
      min: "0",
      max: "10000",
    },
    {
      label: "₹10,000 – ₹20,000",
      min: "10000",
      max: "20000",
    },
    {
      label: "₹20,000 – ₹40,000",
      min: "20000",
      max: "40000",
    },
    {
      label: "Above ₹40,000",
      min: "40000",
      max: "",
    },
  ],

  Electronics: [
    {
      label: "Under ₹1,000",
      min: "0",
      max: "1000",
    },
    {
      label: "₹1,000 – ₹5,000",
      min: "1000",
      max: "5000",
    },
    {
      label: "₹5,000 – ₹20,000",
      min: "5000",
      max: "20000",
    },
    {
      label: "Above ₹20,000",
      min: "20000",
      max: "",
    },
  ],

  Fashion: [
    {
      label: "Under ₹500",
      min: "0",
      max: "500",
    },
    {
      label: "₹500 – ₹1,500",
      min: "500",
      max: "1500",
    },
    {
      label: "₹1,500 – ₹3,000",
      min: "1500",
      max: "3000",
    },
    {
      label: "Above ₹3,000",
      min: "3000",
      max: "",
    },
  ],

  "Home & Kitchen": [
    {
      label: "Under ₹1,000",
      min: "0",
      max: "1000",
    },
    {
      label: "₹1,000 – ₹3,000",
      min: "1000",
      max: "3000",
    },
    {
      label: "₹3,000 – ₹7,000",
      min: "3000",
      max: "7000",
    },
    {
      label: "Above ₹7,000",
      min: "7000",
      max: "",
    },
  ],

  Gaming: [
    {
      label: "Under ₹2,000",
      min: "0",
      max: "2000",
    },
    {
      label: "₹2,000 – ₹5,000",
      min: "2000",
      max: "5000",
    },
    {
      label: "₹5,000 – ₹10,000",
      min: "5000",
      max: "10000",
    },
    {
      label: "Above ₹10,000",
      min: "10000",
      max: "",
    },
  ],
};

const DEFAULT_PRICE_RANGES = [
  {
    label: "Under ₹1,000",
    min: "0",
    max: "1000",
  },
  {
    label: "₹1,000 – ₹5,000",
    min: "1000",
    max: "5000",
  },
  {
    label: "₹5,000 – ₹10,000",
    min: "5000",
    max: "10000",
  },
  {
    label: "Above ₹10,000",
    min: "10000",
    max: "",
  },
];

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // =====================================================
  // URL FILTER VALUES
  // =====================================================

  const category = searchParams.get("category") || "";

  const searchQuery = searchParams.get("search") || "";

  const minPrice = searchParams.get("minPrice") || "";

  const maxPrice = searchParams.get("maxPrice") || "";

  const sort = searchParams.get("sort") || "";

  // =====================================================
  // TANSTACK QUERY - LOAD PRODUCTS
  // =====================================================

  const {
    data: products = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ["products", category],
    queryFn: () => getProducts(category),
  });

  // =====================================================
  // LOCAL PRICE INPUT STATE
  // =====================================================

  const [minPriceInput, setMinPriceInput] = useState(minPrice);

  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  // =====================================================
  // KEEP PRICE INPUTS IN SYNC WITH URL
  // =====================================================

  useEffect(() => {
    setMinPriceInput(minPrice);
    setMaxPriceInput(maxPrice);
  }, [minPrice, maxPrice]);

  // =====================================================
  // UPDATE URL FILTER
  // =====================================================

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);

    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    setSearchParams(params);
  };

  // =====================================================
  // CATEGORY
  // =====================================================

  const handleCategoryChange = (selectedCategory) => {
    const params = new URLSearchParams(searchParams);

    if (selectedCategory) {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }

    /*
      When changing category, clear the
      previous price filter.

      Example:

      Mobiles
      ₹20,000 - ₹40,000

      Click Electronics

      The mobile price range should
      not remain active.
    */

    params.delete("minPrice");
    params.delete("maxPrice");

    setMinPriceInput("");
    setMaxPriceInput("");

    setSearchParams(params);
  };

  // =====================================================
  // PRICE FILTER
  // =====================================================

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams);

    if (minPriceInput) {
      params.set("minPrice", minPriceInput);
    } else {
      params.delete("minPrice");
    }

    if (maxPriceInput) {
      params.set("maxPrice", maxPriceInput);
    } else {
      params.delete("maxPrice");
    }

    setSearchParams(params);
  };

  // =====================================================
  // QUICK PRICE FILTER
  // =====================================================

  const handleQuickPrice = (range) => {
    const params = new URLSearchParams(searchParams);

    if (range.min !== "") {
      params.set("minPrice", range.min);
    } else {
      params.delete("minPrice");
    }

    if (range.max !== "") {
      params.set("maxPrice", range.max);
    } else {
      params.delete("maxPrice");
    }

    setMinPriceInput(range.min);

    setMaxPriceInput(range.max);

    setSearchParams(params);
  };

  // =====================================================
  // CHECK ACTIVE QUICK PRICE
  // =====================================================

  const isPriceRangeActive = (range) => {
    return (
      minPrice === range.min &&
      maxPrice === range.max
    );
  };

  // =====================================================
  // SORT
  // =====================================================

  const handleSortChange = (event) => {
    updateFilter("sort", event.target.value);
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearchParams({});

    setMinPriceInput("");

    setMaxPriceInput("");
  };

  // =====================================================
  // GET PRICE RANGES FOR CURRENT CATEGORY
  // =====================================================

  const currentPriceRanges =
    PRICE_RANGES[category] ||
    DEFAULT_PRICE_RANGES;

  // =====================================================
  // FILTER + SEARCH + SORT
  // =====================================================

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // -------------------------------------------------
    // SEARCH
    // -------------------------------------------------

if (searchQuery.trim()) {
  const query = searchQuery.trim().toLowerCase();

  result = result.filter((product) => {
    const name = product.name?.toLowerCase() || "";

    return name.includes(query);
  });
}

    // -------------------------------------------------
    // MIN PRICE
    // -------------------------------------------------

    if (minPrice !== "") {
      const minimum = Number(minPrice);

      if (!Number.isNaN(minimum)) {
        result = result.filter(
          (product) =>
            Number(product.price) >= minimum
        );
      }
    }

    // -------------------------------------------------
    // MAX PRICE
    // -------------------------------------------------

    if (maxPrice !== "") {
      const maximum = Number(maxPrice);

      if (!Number.isNaN(maximum)) {
        result = result.filter(
          (product) =>
            Number(product.price) <= maximum
        );
      }
    }

    // -------------------------------------------------
    // SORT
    // -------------------------------------------------

    if (sort === "price-low") {
      result.sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price)
      );
    }

    if (sort === "price-high") {
      result.sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price)
      );
    }

    if (sort === "name-az") {
      result.sort(
        (a, b) =>
          a.name.localeCompare(b.name)
      );
    }

    if (sort === "name-za") {
      result.sort(
        (a, b) =>
          b.name.localeCompare(a.name)
      );
    }

    if (sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      );
    }

    return result;
  }, [
    products,
    searchQuery,
    minPrice,
    maxPrice,
    sort,
  ]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <section className="products-page">
        <div className="products-loading">
          <div className="products-loading-icon">
            🛍️
          </div>

          <h2>
            Loading ShopFlow products...
          </h2>

          <p>
            Please wait.
          </p>
        </div>
      </section>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  // =====================================================
  // ACTIVE FILTER COUNT
  // =====================================================

  const activeFilters = [
    category,
    searchQuery,
    minPrice,
    maxPrice,
    sort,
  ].filter(Boolean).length;

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <section className="products-page">

      {/* =================================================
          MAIN FILTER LAYOUT
      ================================================= */}

      <div className="products-filter-layout">

        {/* ===============================================
            FILTER SIDEBAR
        =============================================== */}

        <aside className="products-filters">

          {/* FILTER HEADER */}

          <div className="filters-header">

            <div>
              <h2>
                Filters
              </h2>

              {activeFilters > 0 && (
                <span>
                  {activeFilters} active
                </span>
              )}
            </div>

            {activeFilters > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="clear-filters-button"
              >
                Clear All
              </button>
            )}
          </div>

          {/* =============================================
              CATEGORY
          ============================================= */}

          <div className="filter-section">

            <h3>
              Category
            </h3>

            {/* ALL PRODUCTS */}

            <label className="filter-radio">

              <input
                type="radio"
                name="category"
                checked={category === ""}
                onChange={() =>
                  handleCategoryChange("")
                }
              />

              <span>
                All Products
              </span>

            </label>

            {/* CATEGORY LIST */}

            {CATEGORIES.map((item) => (
              <label
                className="filter-radio"
                key={item}
              >

                <input
                  type="radio"
                  name="category"
                  checked={
                    category === item
                  }
                  onChange={() =>
                    handleCategoryChange(item)
                  }
                />

                <span>
                  {item}
                </span>

              </label>
            ))}

          </div>

          {/* =============================================
              PRICE RANGE
          ============================================= */}

          <div className="filter-section">

            <h3>
              Price
            </h3>

            <div className="price-inputs">

              <input
                type="number"
                min="0"
                placeholder="Min ₹"
                value={minPriceInput}
                onChange={(event) =>
                  setMinPriceInput(
                    event.target.value
                  )
                }
              />

              <span>
                —
              </span>

              <input
                type="number"
                min="0"
                placeholder="Max ₹"
                value={maxPriceInput}
                onChange={(event) =>
                  setMaxPriceInput(
                    event.target.value
                  )
                }
              />

            </div>

            <button
              type="button"
              className="apply-price-button"
              onClick={applyPriceFilter}
            >
              Apply Price
            </button>

          </div>

          {/* =============================================
              CATEGORY-BASED QUICK PRICE
          ============================================= */}

          <div className="filter-section">

            <h3>
              Quick Price
            </h3>

            {currentPriceRanges.map(
              (range) => {

                const active =
                  isPriceRangeActive(range);

                return (
                  <button
                    key={range.label}
                    type="button"
                    className={
                      active
                        ? "quick-price-button active"
                        : "quick-price-button"
                    }
                    onClick={() =>
                      handleQuickPrice(range)
                    }
                  >
                    {range.label}
                  </button>
                );
              }
            )}

          </div>

        </aside>

        {/* ===============================================
            PRODUCT RESULTS
        =============================================== */}

        <div className="products-results">

          {/* RESULTS HEADER */}

          <div className="products-results-header">

            <div>

              <h1>
                {category ||
                  searchQuery ||
                  "All Products"}
              </h1>

              <p>

                {filteredProducts.length}{" "}
                product
                {filteredProducts.length !== 1
                  ? "s"
                  : ""}

                {searchQuery && (
                  <>
                    {" "}
                    matching "
                    <strong>
                      {searchQuery}
                    </strong>
                    "
                  </>
                )}

              </p>

            </div>

            {/* SORT */}

<label htmlFor="products-sort" className="sr-only">
  Sort products
</label>

<select
  id="products-sort"
  value={sort}
  onChange={handleSortChange}
  className="products-sort"
>
  <option value="">
    Sort by: Recommended
  </option>

  <option value="newest">
    Newest
  </option>

  <option value="price-low">
    Price: Low to High
  </option>

  <option value="price-high">
    Price: High to Low
  </option>

  <option value="name-az">
    Name: A to Z
  </option>

  <option value="name-za">
    Name: Z to A
  </option>
</select>

          </div>

          {/* =============================================
              NO RESULTS
          ============================================= */}

          {filteredProducts.length === 0 ? (

            <div className="products-no-results">

              <div>
                🔍
              </div>

              <h2>
                No products found
              </h2>

              <p>
                Try changing your
                search or filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>

            </div>

          ) : (

            /* ===========================================
               PRODUCT GRID
            =========================================== */

            <div className="grid">

              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}

            </div>

          )}

        </div>

      </div>

    </section>
  );
}

export default Products;