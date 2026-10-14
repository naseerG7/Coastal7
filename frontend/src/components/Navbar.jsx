import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { logoutUser } from "../services/authService";
import { getProducts } from "../services/productService";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("access_token");

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "white"
  );

  const [search, setSearch] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // ============================================================
  // THEME
  // ============================================================

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ============================================================
  // PRODUCTS - TANSTACK QUERY
  // ============================================================

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    enabled: Boolean(search.trim()),
  });

  
  // ============================================================
  // SEARCH PRODUCTS
  // ============================================================

  const searchResults = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword || !Array.isArray(products)) {
      return [];
    }

    return products
      .filter((product) => {
        const name = product.name?.toLowerCase() || "";

        return name.includes(keyword);
      })
      .slice(0, 6);
  }, [search, products]);


  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    logoutUser();

    if (location.pathname.startsWith("/admin")) {
      navigate("/admin/login");
    } else {
      navigate("/customer/login");
    }
  };

  // ============================================================
  // NORMAL SEARCH
  // ============================================================

  const handleSearch = (event) => {
    event.preventDefault();

    setShowSearchDropdown(false);

    if (search.trim()) {
      navigate(
        `/products?search=${encodeURIComponent(
          search.trim()
        )}`
      );
    } else {
      navigate("/products");
    }
  };

  // ============================================================
  // OPEN PRODUCT
  // ============================================================

  const handleProductClick = (productId) => {
    setShowSearchDropdown(false);
    setSearch("");
    navigate(`/products/${productId}`);
  };

  // ============================================================
  // CLOSE DROPDOWN
  // ============================================================

  const handleSearchBlur = () => {
    // Small delay so clicking a product still works
    setTimeout(() => {
      setShowSearchDropdown(false);
    }, 150);
  };

  return (
    <header className="shop-header">

      {/* =========================
          MAIN NAVBAR
      ========================== */}

      <div className="navbar">

        {/* LOGO */}

        <Link to="/" className="logo">
          <span className="logo-icon">🛍️</span>

          <span>
            Shop<span>Flow</span>
          </span>
        </Link>

        {/* =========================
            SEARCH
        ========================== */}

        <form
          className="search-box"
          onSubmit={handleSearch}
          onBlur={handleSearchBlur}
        >

          <label htmlFor="product-category" className="visually-hidden">
  Filter products by category
</label>

<select id="product-category" defaultValue="all">
  <option value="all">All</option>
  <option value="electronics">Electronics</option>
  <option value="fashion">Fashion</option>
  <option value="home">Home</option>
  <option value="mobiles">Mobiles</option>
</select>

          <input
            type="text"
            placeholder="Search ShopFlow"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);

              if (event.target.value.trim()) {
                setShowSearchDropdown(true);
              } else {
                setShowSearchDropdown(false);
              }
            }}
            onFocus={() => {
              if (search.trim()) {
                setShowSearchDropdown(true);
              }
            }}
          />

          <button type="submit">
            🔍
          </button>

          {/* =========================
              SEARCH DROPDOWN
          ========================== */}

          {showSearchDropdown &&
            search.trim() && (
              <div className="search-suggestions">

                {productsLoading && (
                  <div className="search-message">
                    Searching products...
                  </div>
                )}

                {!productsLoading &&
                  !productsError &&
                  searchResults.length === 0 && (
                    <div className="search-message">
                      No products found
                    </div>
                  )}

                {!productsLoading &&
                  productsError && (
                    <div className="search-message">
                      Unable to search products
                    </div>
                  )}

                {!productsLoading &&
                  !productsError &&
                  searchResults.map((product) => (
                    <button
                      type="button"
                      key={product.id}
                      className="search-product-item"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleProductClick(
                          product.id
                        );
                      }}
                    >

                      {/* PRODUCT IMAGE */}

                      <div className="search-product-image">

                        {product.image_url ? (
                          <img
                          src={
                          product.image_url.startsWith("http")
                          ? product.image_url
                          : `http://127.0.0.1:8000${product.image_url}`
                            }
                            alt={product.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="search-no-image">
                            🛍️
                          </div>
                        )}

                      </div>

                      {/* PRODUCT INFORMATION */}

                      <div className="search-product-info">

                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          {product.category}
                        </span>

                        <b>
                          ₹
                          {Number(
                            product.price
                          ).toLocaleString("en-IN")}
                        </b>

                      </div>

                    </button>
                  ))}

              </div>
            )}

        </form>

        {/* ACCOUNT */}

        <Link
          to={
            token
              ? "/profile"
              : "/customer/login"
          }
          className="header-item"
        >

          <small>
            Hello, {token ? "Customer" : "Sign in"}
          </small>

          <strong>
            Account & Lists ▾
          </strong>

        </Link>

        {/* ORDERS */}

        <Link
          to="/orders"
          className="header-item orders-header"
        >

          <small>
            Returns
          </small>

          <strong>
            & Orders
          </strong>

        </Link>

        {/* CART */}

        <Link
          to="/cart"
          className="cart-header"
        >

          <span className="cart-icon">
            🛒
          </span>

          <strong>
            Cart
          </strong>

        </Link>

      </div>

      {/* =========================
          CATEGORY NAVBAR
      ========================== */}

      <div className="sub-navbar">

        {/* LEFT SIDE */}

        <div className="sub-nav-left">

          {/* ALL */}

          <Link
            to="/products"
            className="menu-item all-menu"
          >
            ☰ All
          </Link>

          {/* TODAY'S DEALS */}

          <Link
            to="/products"
            className="menu-item"
          >
            Today's Deals
          </Link>

          {/* MOBILES */}

          <Link
            to="/products?category=Mobiles"
            className="menu-item"
          >
            Mobiles
          </Link>

          {/* ELECTRONICS */}

          <Link
            to="/products?category=Electronics"
            className="menu-item"
          >
            Electronics
          </Link>

          {/* FASHION */}

          <Link
            to="/products?category=Fashion"
            className="menu-item"
          >
            Fashion
          </Link>

          {/* HOME & KITCHEN */}

          <Link
            to="/products?category=Home%20%26%20Kitchen"
            className="menu-item"
          >
            Home & Kitchen
          </Link>

          {/* GAMING */}

          <Link
            to="/products?category=Gaming"
            className="menu-item"
          >
            Gaming
          </Link>

          {/* BEST SELLERS */}

          <Link
            to="/products"
            className="menu-item"
          >
            Best Sellers
          </Link>

        </div>

        {/* RIGHT SIDE */}

        <div className="sub-nav-right">

          {/* LOGIN / LOGOUT */}

          {!token ? (
            <Link to="/customer/login">
              Sign In
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="header-logout"
            >
              Logout
            </button>
          )}

          {/* THEME */}

          <select
            value={theme}
            onChange={(event) =>
              setTheme(event.target.value)
            }
            className="theme-selector"
            aria-label="Theme"
          >

            <option value="white">
              ☀️ Light
            </option>

            <option value="dark">
              🌙 Dark
            </option>

          </select>

        </div>

      </div>

    </header>
  );
}

export default Navbar;