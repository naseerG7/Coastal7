import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../services/authService";

function Profile() {
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  if (isError) {
    const errorMessage =
      error.response?.data?.detail ||
      "Failed to load profile";

    return <p className="error">{errorMessage}</p>;
  }

  if (isLoading) {
    return <h2>Loading profile...</h2>;
  }

  return (
    <div className="card">
      <h2>Welcome, {user.name}!</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>User ID: {user.id}</p>
    </div>
  );
}

export default Profile;