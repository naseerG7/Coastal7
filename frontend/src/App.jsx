import { lazy, Suspense } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";

// ==========================================
// Lazy-loaded public pages
// ==========================================

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

// ==========================================
// Lazy-loaded customer pages
// ==========================================

const CustomerLogin = lazy(() => import("./pages/customer/CustomerLogin"));
const Checkout = lazy(() => import("./pages/CheckOut"));
const Orders = lazy(() => import("./pages/orders"));
const Profile = lazy(() => import("./pages/Profile"));

// ==========================================
// Lazy-loaded product pages
// ==========================================

const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/cart"));

// ==========================================
// Lazy-loaded admin pages
// ==========================================

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminSellers = lazy(() => import("./pages/admin/AdminSellers"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminWarehouse = lazy(() => import("./pages/admin/AdminWarehouse"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminDelivery = lazy(() => import("./pages/admin/AdminDelivery"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminRefunds = lazy(() => import("./pages/admin/AdminRefunds"));
const AdminCancellations = lazy(() => import("./pages/admin/AdminCancellations"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));

// ==========================================
// Existing layouts and protection components
// Keep these as regular imports
// ==========================================

import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";

// ==========================================
// Main website layout
// ==========================================


function Layout() {
  return (
    <>
      <Navbar />

      <main className="container">
        <Outlet />
      </main>

      <Footer />

      <Chatbot />
    </>
  );
}


// ==========================================
// App
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="container" role="status">
            Loading page...
          </div>
        }
      >
        <Routes>
          {/* ==========================================
              MAIN WEBSITE
          ========================================== */}

          <Route element={<Layout />}>
            {/* Public routes */}

            <Route path="/" element={<Home />} />

            <Route path="/login" element={<Login />} />

            <Route path="/register" element={<Register />} />

            <Route path="/customer/register" element={<Register />} />

            {/* Customer login */}

            <Route path="/customer/login" element={<CustomerLogin />} />

            {/* Products */}

            <Route path="/products" element={<Products />} />

            <Route
              path="/products/:productId"
              element={<ProductDetails />}
            />

            {/* Cart */}

            <Route path="/cart" element={<Cart />} />

            {/* Protected customer routes */}

            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<Checkout />} />

              <Route path="/orders" element={<Orders />} />

              <Route path="/orders/:orderId" element={<Orders />} />

              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* ==========================================
              ADMIN LOGIN
          ========================================== */}

          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ==========================================
              PROTECTED ADMIN AREA
          ========================================== */}

          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route
                path="/admin/dashboard"
                element={<AdminDashboard />}
              />

              <Route
                path="/admin/customers"
                element={<AdminCustomers />}
              />

              <Route
                path="/admin/sellers"
                element={<AdminSellers />}
              />

              <Route
                path="/admin/products"
                element={<AdminProducts />}
              />

              <Route
                path="/admin/warehouse"
                element={<AdminWarehouse />}
              />

              <Route
                path="/admin/orders"
                element={<AdminOrders />}
              />

              <Route
                path="/admin/delivery"
                element={<AdminDelivery />}
              />

              <Route
                path="/admin/payments"
                element={<AdminPayments />}
              />

              <Route
                path="/admin/refunds"
                element={<AdminRefunds />}
              />

              <Route
                path="/admin/cancellations"
                element={<AdminCancellations />}
              />

              <Route
                path="/admin/support"
                element={<AdminSupport />}
              />

              <Route
                path="/admin/reports"
                element={<AdminReports />}
              />

              <Route
                path="/admin/settings"
                element={<AdminSettings />}
              />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
