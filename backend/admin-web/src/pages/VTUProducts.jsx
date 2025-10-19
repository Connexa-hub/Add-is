import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const VTUProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'airtime',
    network: '',
    category: 'general',
    denomination: 0,
    price: 0,
    vendorCode: '',
    vendor: 'vtpass',
    description: '',
    validity: '',
    commission: 0,
    isActive: true,
    isPopular: false,
    displayOrder: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, [typeFilter, networkFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (networkFilter) params.network = networkFilter;
      
      const response = await api.get('/vtu/admin/products', { params });
      setProducts(response.data.data.products);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/vtu/admin/products/${editingProduct._id}`, formData);
        alert('Product updated successfully');
      } else {
        await api.post('/vtu/admin/products', formData);
        alert('Product created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/vtu/admin/products/${productId}`);
      alert('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      type: product.type,
      network: product.network,
      category: product.category || 'general',
      denomination: product.denomination || 0,
      price: product.price,
      vendorCode: product.vendorCode,
      vendor: product.vendor || 'vtpass',
      description: product.description || '',
      validity: product.validity || '',
      commission: product.commission || 0,
      isActive: product.isActive,
      isPopular: product.isPopular || false,
      displayOrder: product.displayOrder || 0,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      type: 'airtime',
      network: '',
      category: 'general',
      denomination: 0,
      price: 0,
      vendorCode: '',
      vendor: 'vtpass',
      description: '',
      validity: '',
      commission: 0,
      isActive: true,
      isPopular: false,
      displayOrder: 0,
    });
  };

  const types = ['airtime', 'data', 'electricity', 'cable', 'internet'];
  const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
            VTU Products
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Manage airtime, data, and utility products</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={16} style={{ marginRight: '0.25rem' }} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="input-label">Type</label>
            <select className="select-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type} value={type} style={{ textTransform: 'capitalize' }}>{type}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="input-label">Network</label>
            <select className="select-field" value={networkFilter} onChange={(e) => setNetworkFilter(e.target.value)}>
              <option value="">All Networks</option>
              {networks.map(network => (
                <option key={network} value={network}>{network}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--gray-600)' }}>No products found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Network</th>
                  <th>Price</th>
                  <th>Commission</th>
                  <th>Vendor Code</th>
                  <th>Status</th>
                  <th>Popular</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{product.title}</div>
                      {product.description && <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{product.description}</div>}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{product.type}</td>
                    <td>{product.network}</td>
                    <td>₦{product.price.toLocaleString()}</td>
                    <td>{product.commission}%</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{product.vendorCode}</td>
                    <td>
                      <span className={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {product.isPopular && <span className="badge badge-warning">Popular</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => handleEdit(product)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product._id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray-500)' }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Title *</label>
                    <input className="input-field" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div>
                    <label className="input-label">Type *</label>
                    <select className="select-field" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                      {types.map(type => (
                        <option key={type} value={type} style={{ textTransform: 'capitalize' }}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Network *</label>
                    <select className="select-field" value={formData.network} onChange={(e) => setFormData({ ...formData, network: e.target.value })} required>
                      <option value="">Select Network</option>
                      {networks.map(network => (
                        <option key={network} value={network}>{network}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Category</label>
                    <input className="input-field" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                  </div>
                  <div>
                    <label className="input-label">Denomination</label>
                    <input className="input-field" type="number" value={formData.denomination} onChange={(e) => setFormData({ ...formData, denomination: parseFloat(e.target.value) })} />
                  </div>
                  <div>
                    <label className="input-label">Price *</label>
                    <input className="input-field" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} required />
                  </div>
                  <div>
                    <label className="input-label">Commission (%)</label>
                    <input className="input-field" type="number" step="0.01" value={formData.commission} onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Vendor Code *</label>
                    <input className="input-field" value={formData.vendorCode} onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value })} required />
                    <small style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>VTPass product code</small>
                  </div>
                  <div>
                    <label className="input-label">Vendor</label>
                    <input className="input-field" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} />
                  </div>
                  <div>
                    <label className="input-label">Validity</label>
                    <input className="input-field" value={formData.validity} onChange={(e) => setFormData({ ...formData, validity: e.target.value })} placeholder="e.g., 30 days" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Description</label>
                    <textarea className="input-field" rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="input-label">Display Order</label>
                    <input className="input-field" type="number" value={formData.displayOrder} onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="input-label">Status</label>
                    <select className="select-field" value={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.isPopular} onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })} />
                      <span>Mark as popular</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingProduct ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VTUProducts;
