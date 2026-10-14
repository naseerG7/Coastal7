import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  uploadProductImage,
} from "../services/productService";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
};

function ProductAdmin() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const {
    data: products = [],
    isLoading: loading,
    isError,
    error: productsError,
  } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: getProducts,
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "products"],
      });
      setMessage("Product created.");
    },
    onError: (error) => {
      setError(
        error.response?.data?.detail || "Operation failed"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "products"],
      });
      setMessage("Product updated.");
    },
    onError: (error) => {
      setError(
        error.response?.data?.detail || "Operation failed"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "products"],
      });
      setMessage("Product deleted.");
    },
    onError: (error) => {
      setError(
        error.response?.data?.detail || "Delete failed"
      );
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }) => uploadProductImage(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "products"],
      });
      setMessage("Image uploaded.");
    },
    onError: (error) => {
      setError(
        error.response?.data?.detail || "Image upload failed"
      );
    },
  });

  const change = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const payload = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch {
      // Error is already handled by the mutation.
    }
  };

  const edit = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
    });

    setError("");
    setMessage("");
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    setError("");
    setMessage("");

    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      // Error is already handled by the mutation.
    }
  };

  const upload = async (id, file) => {
    if (!file) return;

    setError("");
    setMessage("");

    try {
      await uploadMutation.mutateAsync({
        id,
        file,
      });
    } catch {
      // Error is already handled by the mutation.
    }
  };

  if (loading) {
    return <p>Loading products...</p>;
  }

  if (isError) {
    return (
      <p className="error">
        {productsError?.response?.data?.detail ||
          "Failed to load products"}
      </p>
    );
  }

  return (
    <div>
      <div className="form-card">
        <h2>{editingId ? "Edit Product" : "Create Product"}</h2>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <form onSubmit={submit}>
          <input
            name="name"
            placeholder="Product name"
            value={form.name}
            onChange={change}
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={change}
          />

          <input
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={change}
            required
          />

          <input
            name="stock"
            type="number"
            min="0"
            placeholder="Stock"
            value={form.stock}
            onChange={change}
            required
          />

          <div>
            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingId
                  ? "Update"
                  : "Create"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-list">
        <h2>Existing Products</h2>

        {products.map((product) => (
          <div className="admin-row" key={product.id}>
            <div>
              <strong>{product.name}</strong>

              <span>
                ₹{Number(product.price).toLocaleString("en-IN")} ·
                Stock {product.stock}
              </span>
            </div>

            <div className="actions">
              <label className="button secondary">
                {uploadMutation.isPending
                  ? "Uploading..."
                  : "Upload Image"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) =>
                    upload(product.id, e.target.files?.[0])
                  }
                />
              </label>

              <button
                className="secondary"
                onClick={() => edit(product)}
              >
                Edit
              </button>

              <button
                className="danger"
                onClick={() => remove(product.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductAdmin;