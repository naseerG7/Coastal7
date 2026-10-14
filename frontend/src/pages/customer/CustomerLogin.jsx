import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, getCurrentUser } from "../../services/authService";

function CustomerLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      console.log("CUSTOMER LOGIN START");
      console.log("Email:", email);

      const loginResponse = await loginUser(email, password);

      console.log("LOGIN SUCCESS:", loginResponse);

      const user = await getCurrentUser();

      console.log("CURRENT USER:", user);

      if (user.role !== "customer") {
        localStorage.removeItem("access_token");
        setError("This login is only for customers.");
        return;
      }

      console.log("CUSTOMER VERIFIED");

      navigate("/products", { replace: true });
    } catch (error) {
      console.error("CUSTOMER LOGIN ERROR:", error);

      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);
      console.error("Message:", error.message);

      setError(
        error.response?.data?.detail ||
          "Login failed. Check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-card">
      <h1>Customer Login</h1>

      <p>Login to shop, manage your cart, and view your orders.</p>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Customer Login"}
        </button>
      </form>

      <p>
        New customer?{" "}
        <Link to="/customer/register">
          Create an account
        </Link>
      </p>

      <p>
        Are you an administrator?{" "}
        <Link to="/admin/login">
          Admin Login
        </Link>
      </p>
    </section>
  );
}

export default CustomerLogin;