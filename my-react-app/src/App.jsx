import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api/products/';

const initialFormState = {
  name: '',
  price: '',
  category: '',
  stock: '',
  description: '',
};

function App() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch products (HTTP ${response.status})`);
      }
      const data = await response.json();
      setProducts(data);
      setErrorMessage('');
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setErrorMessage('Cannot connect to backend (is Django server running on port 8000?)');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleView = (product) => {
    setViewingProduct(product);
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name || '',
      price: product.price || '',
      category: product.category || '',
      stock: product.stock !== undefined ? product.stock : '',
      description: product.description || '',
    });
    setErrorMessage('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Product Name is required.');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage('Please enter a valid price (e.g. 19.99).');
      return;
    }

    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setErrorMessage('Please enter a valid stock quantity (e.g. 10).');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      price: priceNum.toFixed(2),
      category: formData.category.trim() || 'General',
      stock: stockNum,
      description: formData.description.trim(),
    };

    setLoading(true);
    try {
      if (editingId) {
        // PUT update
        const response = await fetch(`${API_BASE_URL}${editingId}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || JSON.stringify(errData) || `Update failed (HTTP ${response.status})`);
        }

        const updated = await response.json();
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? updated : p))
        );
        handleCancel();
      } else {
        // POST create
        const response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || JSON.stringify(errData) || `Add failed (HTTP ${response.status})`);
        }

        const created = await response.json();
        setProducts((prev) => [...prev, created]);
        setFormData(initialFormState);
      }
    } catch (err) {
      console.error('Error saving product:', err);
      setErrorMessage(err.message || 'Error communicating with backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}${id}/`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        if (editingId === id) handleCancel();
      } else {
        throw new Error(`Delete failed (HTTP ${response.status})`);
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setErrorMessage(err.message || 'Error deleting product.');
    }
  };

  return (
    <div className="container">
      <h2>Products</h2>

      {errorMessage && (
        <div className="error-box">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-row">
          <input
            type="text"
            name="name"
            placeholder="Name *"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            name="price"
            placeholder="Price *"
            value={formData.price}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            min="0"
            name="stock"
            placeholder="Stock *"
            value={formData.stock}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-row">
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="input-desc"
          />
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Update (PUT)' : 'Add Product'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} className="btn btn-cancel" disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Black and White Table */}
      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>
                No products found
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>${parseFloat(product.price).toFixed(2)}</td>
                <td>{product.stock}</td>
                <td>{product.description}</td>
                <td className="actions-cell">
                  <button
                    type="button"
                    onClick={() => handleView(product)}
                    className="btn-small btn-view"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(product)}
                    className="btn-small"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
                    className="btn-small"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* View Product Details (Simple Box) */}
      {viewingProduct && (
        <div className="view-details-box">
          <h3>View Product Details</h3>
          <p><strong>ID:</strong> {viewingProduct.id}</p>
          <p><strong>Name:</strong> {viewingProduct.name}</p>
          <p><strong>Category:</strong> {viewingProduct.category || 'N/A'}</p>
          <p><strong>Price:</strong> ${parseFloat(viewingProduct.price || 0).toFixed(2)}</p>
          <p><strong>Stock:</strong> {viewingProduct.stock}</p>
          <p><strong>Description:</strong> {viewingProduct.description || 'None'}</p>
          <button
            type="button"
            onClick={() => setViewingProduct(null)}
            className="btn btn-cancel"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
