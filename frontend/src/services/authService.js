import api from "./api";

// Register a new user
export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

// Login user
export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

  const response = await api.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  localStorage.setItem(
    "access_token",
    response.data.access_token
  );
    sessionStorage.removeItem("shopflow_chat_messages");
  window.dispatchEvent(new Event("shopflow-auth-changed"));
  return response.data;
};

// Get currently logged-in user
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// Logout and clear the previous customer's chat
export const logoutUser = () => {
  localStorage.removeItem("access_token");
  sessionStorage.removeItem("shopflow_chat_messages");

  window.dispatchEvent(new Event("shopflow-auth-changed"));
};