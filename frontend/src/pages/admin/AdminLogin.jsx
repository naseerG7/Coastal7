import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, getCurrentUser } from "../../services/authService";

function AdminLogin() {
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
      // Backend uses the same /auth/login endpoint
      // for both customers and admins.
      await loginUser(email, password);

      // Check which role logged in.
      const user = await getCurrentUser();

      if (user.role !== "admin") {
        localStorage.removeItem("access_token");
        setError("Admin access required.");
        return;
      }

      // Admin verified successfully.
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("ADMIN LOGIN ERROR:", error);

      setError(
        error.response?.data?.detail ||
          "Invalid admin email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-card">
      <h1>Admin Login</h1>

      <p>Login to manage the ShopFlow store.</p>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Admin Email"
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
          {loading ? "Signing in..." : "Admin Login"}
        </button>
      </form>
    </section>
  );
}

export default AdminLogin;