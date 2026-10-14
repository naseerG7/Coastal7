import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getProducts } from "../services/productService";

function Home() {
  const {
    data: products = [],
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  if (isError) {
    console.error("Failed to load products", error);
  }

  return (
    <div className="home">

      {/* HERO */}
      <section className="home-hero">

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <span className="hero-badge">
            BIG SHOPPING DAYS
          </span>

          <h1>
            Everything You Need.
            <br />
            <span>All in One Place.</span>
          </h1>

          <p>
            Discover amazing products at great prices.
            <br />
            Fast delivery. Great deals. Trusted shopping.
          </p>

          <div className="hero-buttons">
            <Link to="/products" className="shop-btn">
              Shop Now →
            </Link>

            <Link to="/products" className="hero-secondary-btn">
              Today's Deals
            </Link>
          </div>

          <div className="hero-features">
            <span>🚚 Fast Delivery</span>
            <span>🔒 Secure Payment</span>
            <span>↩️ Easy Returns</span>
          </div>

        </div>

        <div className="hero-shopping-image">
          🛍️
        </div>

      </section>

      {/* CATEGORY SECTION */}
      <section className="home-section">

        <div className="section-title">

          <div>
            <span className="section-label">
              EXPLORE
            </span>

            <h2>
              Shop by Category
            </h2>
          </div>

          <Link to="/products">
            View All →
          </Link>

        </div>

        <div className="category-grid">

          <Link to="/products" className="category-card">
            <div className="category-icon">📱</div>
            <h3>Mobiles</h3>
            <p>Latest smartphones</p>
          </Link>

          <Link to="/products" className="category-card">
            <div className="category-icon">💻</div>
            <h3>Electronics</h3>
            <p>Tech & gadgets</p>
          </Link>

          <Link to="/products" className="category-card">
            <div className="category-icon">👕</div>
            <h3>Fashion</h3>
            <p>Style for everyone</p>
          </Link>

          <Link to="/products" className="category-card">
            <div className="category-icon">🏠</div>
            <h3>Home</h3>
            <p>Make home better</p>
          </Link>

          <Link to="/products" className="category-card">
            <div className="category-icon">🎮</div>
            <h3>Gaming</h3>
            <p>Level up your game</p>
          </Link>

          <Link to="/products" className="category-card">
            <div className="category-icon">⌚</div>
            <h3>Watches</h3>
            <p>Smart & classic</p>
          </Link>

        </div>

      </section>

      {/* DEALS */}
      <section className="deal-section">

        <div className="deal-header">

          <div>
            <span className="section-label">
              LIMITED TIME
            </span>

            <h2>
              🔥 Today's Deals
            </h2>

            <p>
              Grab amazing products before they're gone.
            </p>
          </div>

          <Link to="/products">
            See all deals →
          </Link>

        </div>

        {loading ? (

          <div className="loading-box">
            Loading products...
          </div>

        ) : products.length === 0 ? (

          <div className="empty-products">
            <h3>No products available</h3>
            <p>
              Add products from the admin panel.
            </p>
          </div>

        ) : (

          <div className="product-grid">

            {products.slice(0, 4).map((product) => (

              <Link
                to={`/products/${product.id}`}
                className="product-card"
                key={product.id}
              >

                <div className="product-photo">

                  {product.image_url ? (
                    <img
                      src={`http://127.0.0.1:8000${product.image_url}`}
                      alt={product.name}
                      loading="lazy"
                    />
                  ) : (
                    <span className="no-image">
                      📦
                    </span>
                  )}

                  <span className="deal-badge">
                    Deal
                  </span>

                </div>

                <div className="product-info">

                  <h3>
                    {product.name}
                  </h3>

                  <div className="rating">
                    ⭐⭐⭐⭐⭐
                    <span> 4.5</span>
                  </div>

                  <p className="product-description">
                    {product.description || "Quality product at a great price."}
                  </p>

                  <div className="price-row">

                    <strong className="product-price">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </strong>

                  </div>

                  <p className="delivery">
                    🚚 Free Delivery
                  </p>

                  <button
                    type="button"
                    className="add-cart-btn"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    Add to Cart
                  </button>

                </div>

              </Link>

            ))}

          </div>

        )}

      </section>

      {/* PROMOTIONAL BANNER */}
      <section className="promo-banner">

        <div className="promo-content">

          <span>
            SHOPFLOW SPECIAL
          </span>

          <h2>
            Upgrade Your Everyday.
          </h2>

          <p>
            Discover electronics, accessories,
            home products and more.
          </p>

          <Link
            to="/products"
            className="promo-button"
          >
            Explore Products →
          </Link>

        </div>

        <div className="promo-image">
          💻
        </div>

      </section>

      {/* MORE PRODUCTS */}
      {products.length > 4 && (

        <section className="home-section">

          <div className="section-title">

            <div>
              <span className="section-label">
                MORE TO EXPLORE
              </span>

              <h2>
                Recommended For You
              </h2>
            </div>

            <Link to="/products">
              See All →
            </Link>

          </div>

          <div className="product-grid">

            {products.slice(4, 8).map((product) => (

              <Link
                to={`/products/${product.id}`}
                className="product-card"
                key={product.id}
              >

                <div className="product-photo">

                  {product.image_url ? (
                   <img
                    src={`http://127.0.0.1:8000${product.image_url}`}
                    alt={product.name}
                    loading="lazy"
                  />
                  ) : (
                    <span className="no-image">
                      📦
                    </span>
                  )}

                </div>

                <div className="product-info">

                  <h3>
                    {product.name}
                  </h3>

                  <div className="rating">
                    ⭐⭐⭐⭐⭐
                    <span> 4.5</span>
                  </div>

                  <strong className="product-price">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </strong>

                  <p className="delivery">
                    🚚 Free Delivery
                  </p>

                  <button
                    type="button"
                    className="add-cart-btn"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                  >
                    Add to Cart
                  </button>

                </div>

              </Link>

            ))}

          </div>

        </section>

      )}

    </div>
  );
}

export default Home;
