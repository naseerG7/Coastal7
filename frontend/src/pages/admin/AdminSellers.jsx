import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";

function AdminSellers() {
  const {
    data: sellers = [],
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: async () => {
      const response = await api.get("/admin/sellers");
      return response.data;
    },
  });

  if (loading) {
    return (
      <>
        <h1>Sellers</h1>
        <p>Loading sellers...</p>
      </>
    );
  }

  if (isError) {
    console.error("Admin sellers error:", error);

    const errorMessage =
      error.response?.data?.detail ||
      "Failed to load sellers.";

    return (
      <>
        <h1>Sellers</h1>
        <p className="status-danger">{errorMessage}</p>
      </>
    );
  }

  return (
    <>
      <h1>Sellers</h1>
      <p>Manage registered sellers.</p>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>

          <tbody>
            {sellers.length === 0 ? (
              <tr>
                <td colSpan="4">No sellers found.</td>
              </tr>
            ) : (
              sellers.map((seller) => (
                <tr key={seller.id}>
                  <td>{seller.id}</td>
                  <td>{seller.name}</td>
                  <td>{seller.email}</td>
                  <td>{seller.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default AdminSellers;