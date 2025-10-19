import { useState, useEffect } from 'react';
import api from '../services/api';

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaType: 'image',
    mediaUrl: '',
    targetUrl: '',
    targetSection: [],
    weight: 1,
    activeFrom: '',
    activeTo: '',
    isActive: true
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/banners/admin/list');
      if (response.data.success) {
        setBanners(response.data.data.banners);
      }
    } catch (error) {
      console.error('Failed to load banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/banners/admin/${editingId}`, formData);
        alert('Banner updated successfully');
      } else {
        await api.post('/api/banners/admin', formData);
        alert('Banner created successfully');
      }
      resetForm();
      loadBanners();
    } catch (error) {
      alert('Failed to save banner: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteBanner = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.delete(`/api/banners/admin/${id}`);
      alert('Banner deleted successfully');
      loadBanners();
    } catch (error) {
      alert('Failed to delete banner');
    }
  };

  const editBanner = (banner) => {
    setFormData({
      title: banner.title,
      description: banner.description || '',
      mediaType: banner.mediaType,
      mediaUrl: banner.mediaUrl,
      targetUrl: banner.targetUrl || '',
      targetSection: banner.targetSection,
      weight: banner.weight,
      activeFrom: banner.activeFrom ? new Date(banner.activeFrom).toISOString().slice(0, 16) : '',
      activeTo: banner.activeTo ? new Date(banner.activeTo).toISOString().slice(0, 16) : '',
      isActive: banner.isActive
    });
    setEditingId(banner._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      mediaType: 'image',
      mediaUrl: '',
      targetUrl: '',
      targetSection: [],
      weight: 1,
      activeFrom: '',
      activeTo: '',
      isActive: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleSection = (section) => {
    setFormData(prev => ({
      ...prev,
      targetSection: prev.targetSection.includes(section)
        ? prev.targetSection.filter(s => s !== section)
        : [...prev.targetSection, section]
    }));
  };

  const sections = ['home', 'airtime', 'data', 'electricity', 'cable', 'wallet'];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600 mt-1">Manage promotional banners and advertisements</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Create Banner
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading banners...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div key={banner._id} className="bg-white rounded-lg shadow overflow-hidden">
              {banner.mediaType === 'image' && (
                <img
                  src={banner.mediaUrl}
                  alt={banner.title}
                  className="w-full h-40 object-cover"
                />
              )}
              {banner.mediaType === 'video' && (
                <video src={banner.mediaUrl} className="w-full h-40 object-cover" controls />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{banner.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{banner.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {banner.targetSection.map(section => (
                    <span key={section} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {section}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  <div>Weight: {banner.weight}</div>
                  <div>Clicks: {banner.clickCount} | Views: {banner.impressionCount}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editBanner(banner)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteBanner(banner._id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editingId ? 'Edit' : 'Create'} Banner</h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Media Type</label>
                  <select
                    value={formData.mediaType}
                    onChange={(e) => setFormData({...formData, mediaType: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="gif">GIF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Weight (Priority)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Media URL *</label>
                <input
                  type="url"
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({...formData, mediaUrl: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target URL (Optional)</label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({...formData, targetUrl: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://example.com/promo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Sections *</label>
                <div className="flex flex-wrap gap-2">
                  {sections.map(section => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => toggleSection(section)}
                      className={`px-3 py-2 rounded-lg ${
                        formData.targetSection.includes(section)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Active From</label>
                  <input
                    type="datetime-local"
                    value={formData.activeFrom}
                    onChange={(e) => setFormData({...formData, activeFrom: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Active To</label>
                  <input
                    type="datetime-local"
                    value={formData.activeTo}
                    onChange={(e) => setFormData({...formData, activeTo: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">Active</label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'} Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
