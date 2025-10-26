import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
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

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaType: 'image',
    mediaUrl: '',
    targetUrl: '',
    targetSection: [],
    weight: 1,
    activeFrom: new Date().toISOString().slice(0, 16),
    activeTo: '',
    isActive: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/banners/admin/list');
      setBanners(response.data.data.banners);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await api.put(`/banners/admin/${editingBanner._id}`, formData);
        alert('Banner updated successfully');
      } else {
        await api.post('/banners/admin', formData);
        alert('Banner created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (bannerId) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.delete(`/banners/admin/${bannerId}`);
      alert('Banner deleted successfully');
      fetchBanners();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete banner');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      mediaType: banner.mediaType,
      mediaUrl: banner.mediaUrl,
      targetUrl: banner.targetUrl || '',
      targetSection: banner.targetSection,
      weight: banner.weight,
      activeFrom: new Date(banner.activeFrom).toISOString().slice(0, 16),
      activeTo: banner.activeTo ? new Date(banner.activeTo).toISOString().slice(0, 16) : '',
      isActive: banner.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      mediaType: 'image',
      mediaUrl: '',
      targetUrl: '',
      targetSection: [],
      weight: 1,
      activeFrom: new Date().toISOString().slice(0, 16),
      activeTo: '',
      isActive: true,
    });
  };

  const handleSectionToggle = (section) => {
    setFormData(prev => ({
      ...prev,
      targetSection: prev.targetSection.includes(section)
        ? prev.targetSection.filter(s => s !== section)
        : [...prev.targetSection, section]
    }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, GIF, MP4, or WEBM files.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const response = await api.post('/upload', {
            file: reader.result,
            filename: file.name
          });

          if (response.data.success) {
            const uploadedUrl = `${window.location.origin}${response.data.data.url}`;
            setFormData({ ...formData, mediaUrl: uploadedUrl });
            alert('File uploaded successfully!');
          }
        } catch (error) {
          console.error('Upload error:', error);
          alert('Failed to upload file: ' + (error.response?.data?.message || error.message));
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        alert('Failed to read file');
        setUploading(false);
      };
    } catch (error) {
      alert('Failed to upload file');
      setUploading(false);
    }
  };

  const sections = ['home', 'airtime', 'data', 'electricity', 'cable', 'wallet'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Banner Management
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Manage promotional banners and advertisements</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={16} style={{ marginRight: '0.25rem' }} />
          Create Banner
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
          </div>
        ) : banners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--gray-600)' }}>No banners found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Sections</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Dates</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner._id}>
                    <td>
                      {banner.mediaType === 'image' ? (
                        <img src={banner.mediaUrl} alt={banner.title} style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '80px', height: '50px', backgroundColor: 'var(--gray-200)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Eye size={20} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{banner.title}</div>
                      {banner.description && <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{banner.description}</div>}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{banner.mediaType}</td>
                    <td>{banner.targetSection.join(', ')}</td>
                    <td>{banner.weight}</td>
                    <td>
                      <span className={`badge ${banner.isActive ? 'badge-success' : 'badge-error'}`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      <div>{new Date(banner.activeFrom).toLocaleDateString()}</div>
                      {banner.activeTo && <div>to {new Date(banner.activeTo).toLocaleDateString()}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-primary" onClick={() => handleEdit(banner)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-sm btn-error" onClick={() => handleDelete(banner._id)}>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {editingBanner ? 'Edit Banner' : 'Create Banner'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Title *</label>
                <input className="input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Description</label>
                <textarea className="input" rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Media Type *</label>
                <select className="input" value={formData.mediaType} onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="gif">GIF</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Media URL *</label>
                <input className="input" type="url" value={formData.mediaUrl} onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })} required />
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)', display: 'block', marginBottom: '0.5rem' }}>Or upload a file:</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/webm"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                    id="banner-file-upload"
                  />
                  <label
                    htmlFor="banner-file-upload"
                    className="input"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      backgroundColor: uploading ? 'var(--gray-100)' : 'var(--gray-50)',
                      border: '2px dashed var(--gray-300)',
                      opacity: uploading ? 0.6 : 1
                    }}
                  >
                    {uploading ? '📤 Uploading...' : '📁 Choose File (JPG, PNG, GIF, MP4, WEBM - Max 5MB)'}
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    Uploaded files will be stored on the server and URL will be auto-filled above
                  </p>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Target URL</label>
                <input className="input" type="url" value={formData.targetUrl} onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Target Sections *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {sections.map((section) => (
                    <label key={section} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem', backgroundColor: formData.targetSection.includes(section) ? 'var(--primary-light)' : 'var(--gray-100)', borderRadius: '4px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.targetSection.includes(section)} onChange={() => handleSectionToggle(section)} />
                      <span style={{ textTransform: 'capitalize' }}>{section}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">Weight (Priority)</label>
                  <input className="input" type="number" min="0" max="100" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="label">Active From *</label>
                  <input className="input" type="datetime-local" value={formData.activeFrom} onChange={(e) => setFormData({ ...formData, activeFrom: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Active To</label>
                  <input className="input" type="datetime-local" value={formData.activeTo} onChange={(e) => setFormData({ ...formData, activeTo: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingBanner ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banners;
