import { useState, useEffect } from 'react';
import api from '../services/api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, Edit, Trash2, Eye, GripVertical } from 'lucide-react';

const BannerManagement = () => {
  const [activeTab, setActiveTab] = useState('banners');
  const [banners, setBanners] = useState([]);
  const [onboardingSlides, setOnboardingSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const [bannerFormData, setBannerFormData] = useState({
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

  const [onboardingFormData, setOnboardingFormData] = useState({
    title: '',
    description: '',
    mediaType: 'image',
    mediaUrl: '',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    order: 0,
    isActive: true,
    metadata: {
      buttonText: '',
      titleFontSize: 32,
      descriptionFontSize: 16,
      alignment: 'center'
    }
  });

  const sections = [
    'home-top', 'home-middle', 'home-bottom',
    'airtime', 'data', 'electricity', 'tv',
    'internet', 'betting', 'education', 'insurance',
    'wallet', 'onboarding'
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'banners') {
        await loadBanners();
      } else {
        await loadOnboardingSlides();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBanners = async () => {
    try {
      const response = await api.get('/banners/admin/list');
      if (response.data.success) {
        setBanners(response.data.data.banners || []);
      }
    } catch (error) {
      console.error('Failed to load banners:', error);
    }
  };

  const loadOnboardingSlides = async () => {
    try {
      const response = await api.get('/admin/onboarding');
      if (response.data.success) {
        setOnboardingSlides(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load onboarding slides:', error);
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/banners/admin/${editingId}`, bannerFormData);
        alert('Banner updated successfully');
      } else {
        await api.post('/banners/admin', bannerFormData);
        alert('Banner created successfully');
      }
      resetForm();
      loadBanners();
    } catch (error) {
      alert('Failed to save banner: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/onboarding/${editingId}`, onboardingFormData);
        alert('Onboarding slide updated successfully');
      } else {
        await api.post('/admin/onboarding', onboardingFormData);
        alert('Onboarding slide created successfully');
      }
      resetForm();
      loadOnboardingSlides();
    } catch (error) {
      alert('Failed to save onboarding slide: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteBanner = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.delete(`/banners/admin/${id}`);
      alert('Banner deleted successfully');
      loadBanners();
    } catch (error) {
      alert('Failed to delete banner');
    }
  };

  const deleteOnboardingSlide = async (id) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    try {
      await api.delete(`/admin/onboarding/${id}`);
      alert('Onboarding slide deleted successfully');
      loadOnboardingSlides();
    } catch (error) {
      alert('Failed to delete slide');
    }
  };

  const toggleBannerStatus = async (id, currentStatus) => {
    try {
      await api.put(`/banners/admin/${id}`, { isActive: !currentStatus });
      loadBanners();
    } catch (error) {
      alert('Failed to toggle banner status');
    }
  };

  const toggleOnboardingStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/onboarding/${id}`, { isActive: !currentStatus });
      loadOnboardingSlides();
    } catch (error) {
      alert('Failed to toggle slide status');
    }
  };

  const editBanner = (banner) => {
    setBannerFormData({
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
    setPreviewUrl(banner.mediaUrl);
    setEditingId(banner._id);
    setShowForm(true);
  };

  const editOnboardingSlide = (slide) => {
    setOnboardingFormData({
      title: slide.title,
      description: slide.description,
      mediaType: slide.mediaType,
      mediaUrl: slide.mediaUrl,
      backgroundColor: slide.backgroundColor,
      textColor: slide.textColor,
      order: slide.order,
      isActive: slide.isActive,
      metadata: slide.metadata || {
        buttonText: '',
        titleFontSize: 32,
        descriptionFontSize: 16,
        alignment: 'center'
      }
    });
    setPreviewUrl(slide.mediaUrl);
    setEditingId(slide._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setBannerFormData({
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
    setOnboardingFormData({
      title: '',
      description: '',
      mediaType: 'image',
      mediaUrl: '',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      order: 0,
      isActive: true,
      metadata: {
        buttonText: '',
        titleFontSize: 32,
        descriptionFontSize: 16,
        alignment: 'center'
      }
    });
    setEditingId(null);
    setShowForm(false);
    setPreviewUrl('');
  };

  const toggleSection = (section) => {
    setBannerFormData(prev => ({
      ...prev,
      targetSection: prev.targetSection.includes(section)
        ? prev.targetSection.filter(s => s !== section)
        : [...prev.targetSection, section]
    }));
  };

  const handleMediaUrlChange = (url) => {
    if (activeTab === 'banners') {
      setBannerFormData({ ...bannerFormData, mediaUrl: url });
    } else {
      setOnboardingFormData({ ...onboardingFormData, mediaUrl: url });
    }
    setPreviewUrl(url);
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
          const response = await api.post('/uploads', {
            file: reader.result,
            filename: file.name
          });

          if (response.data.success) {
            const uploadedUrl = `${window.location.origin}${response.data.data.url}`;
            handleMediaUrlChange(uploadedUrl);
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

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(onboardingSlides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedWithNewOrder = items.map((item, index) => ({
      id: item._id,
      order: index
    }));

    setOnboardingSlides(items);

    try {
      await api.post('/admin/onboarding/reorder', { slides: reorderedWithNewOrder });
    } catch (error) {
      alert('Failed to reorder slides');
      loadOnboardingSlides();
    }
  };

  const filteredBanners = banners.filter(banner => {
    const matchesSearch = banner.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         banner.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = sectionFilter === 'all' || banner.targetSection.includes(sectionFilter);
    return matchesSearch && matchesSection;
  });

  const filteredSlides = onboardingSlides.filter(slide => 
    slide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    slide.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Banner & Carousel Management
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>Manage promotional banners, carousels, and onboarding slides</p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--gray-200)' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setActiveTab('banners')}
            style={{
              padding: '0.75rem 0.5rem',
              fontWeight: '600',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'banners' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'banners' ? 'var(--primary)' : 'var(--gray-600)',
              cursor: 'pointer'
            }}
          >
            Banners & Carousels
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            style={{
              padding: '0.75rem 0.5rem',
              fontWeight: '600',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'onboarding' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'onboarding' ? 'var(--primary)' : 'var(--gray-600)',
              cursor: 'pointer'
            }}
          >
            Onboarding Slides
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
          style={{ flex: 1 }}
        />
        {activeTab === 'banners' && (
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="input"
            style={{ width: '200px' }}
          >
            <option value="all">All Sections</option>
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        )}
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          style={{ whiteSpace: 'nowrap' }}
        >
          <Plus size={16} style={{ marginRight: '0.5rem' }} />
          Create {activeTab === 'banners' ? 'Banner' : 'Slide'}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-600)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          Loading...
        </div>
      ) : activeTab === 'banners' ? (
        /* Banner List */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredBanners.map((banner) => (
            <div key={banner._id} className="card" style={{ overflow: 'hidden' }}>
              {banner.mediaType === 'image' && (
                <img
                  src={banner.mediaUrl}
                  alt={banner.title}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
              )}
              {banner.mediaType === 'video' && (
                <video src={banner.mediaUrl} style={{ width: '100%', height: '200px', objectFit: 'cover' }} controls />
              )}
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontWeight: '600', fontSize: '1.125rem', flex: 1 }}>{banner.title}</h3>
                  <button
                    onClick={() => toggleBannerStatus(banner._id, banner.isActive)}
                    className={`badge ${banner.isActive ? 'badge-success' : 'badge-error'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {banner.isActive ? '✓ Active' : '○ Inactive'}
                  </button>
                </div>
                {banner.description && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
                    {banner.description}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
                  {banner.targetSection.map(section => (
                    <span key={section} className="badge" style={{ fontSize: '0.75rem' }}>
                      {section}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{banner.weight}</div>
                    <div>Weight</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{banner.clickCount || 0}</div>
                    <div>Clicks</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{banner.impressionCount || 0}</div>
                    <div>Views</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => editBanner(banner)} className="btn btn-sm btn-primary" style={{ flex: 1 }}>
                    <Edit size={14} style={{ marginRight: '0.25rem' }} />
                    Edit
                  </button>
                  <button onClick={() => deleteBanner(banner._id)} className="btn btn-sm btn-error" style={{ flex: 1 }}>
                    <Trash2 size={14} style={{ marginRight: '0.25rem' }} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredBanners.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--gray-600)' }}>
              No banners found. Create your first banner to get started!
            </div>
          )}
        </div>
      ) : (
        /* Onboarding Slides List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredSlides.map((slide, index) => (
            <div key={slide._id} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '3rem', background: 'var(--gray-100)', cursor: 'move' }}>
                  <GripVertical size={20} style={{ color: 'var(--gray-400)' }} />
                </div>
                <div style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--gray-200)', flexShrink: 0 }}>
                    <img
                      src={slide.mediaUrl}
                      alt={slide.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: '600', fontSize: '1.125rem' }}>{slide.title}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{slide.description}</p>
                      </div>
                      <button
                        onClick={() => toggleOnboardingStatus(slide._id, slide.isActive)}
                        className={`badge ${slide.isActive ? 'badge-success' : 'badge-error'}`}
                        style={{ cursor: 'pointer', border: 'none', marginLeft: '1rem', whiteSpace: 'nowrap' }}
                      >
                        {slide.isActive ? '✓ Active' : '○ Inactive'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                      <span className="badge">Order: {slide.order}</span>
                      <span>BG: {slide.backgroundColor}</span>
                      <span>Text: {slide.textColor}</span>
                      <span style={{ textTransform: 'capitalize' }}>{slide.metadata?.alignment || 'center'} aligned</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => editOnboardingSlide(slide)} className="btn btn-sm btn-primary">
                      <Edit size={14} style={{ marginRight: '0.25rem' }} />
                      Edit
                    </button>
                    <button onClick={() => deleteOnboardingSlide(slide._id)} className="btn btn-sm btn-error">
                      <Trash2 size={14} style={{ marginRight: '0.25rem' }} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredSlides.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-600)' }}>
              No onboarding slides found. Create your first slide to get started!
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {editingId ? 'Edit' : 'Create'} {activeTab === 'banners' ? 'Banner' : 'Onboarding Slide'}
            </h2>

            <form onSubmit={activeTab === 'banners' ? handleBannerSubmit : handleOnboardingSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left Column */}
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Title *</label>
                    <input
                      type="text"
                      value={activeTab === 'banners' ? bannerFormData.title : onboardingFormData.title}
                      onChange={(e) => activeTab === 'banners'
                        ? setBannerFormData({...bannerFormData, title: e.target.value})
                        : setOnboardingFormData({...onboardingFormData, title: e.target.value})
                      }
                      className="input"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Description</label>
                    <textarea
                      value={activeTab === 'banners' ? bannerFormData.description : onboardingFormData.description}
                      onChange={(e) => activeTab === 'banners'
                        ? setBannerFormData({...bannerFormData, description: e.target.value})
                        : setOnboardingFormData({...onboardingFormData, description: e.target.value})
                      }
                      className="input"
                      rows="3"
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">Media URL *</label>
                    <input
                      type="url"
                      value={activeTab === 'banners' ? bannerFormData.mediaUrl : onboardingFormData.mediaUrl}
                      onChange={(e) => handleMediaUrlChange(e.target.value)}
                      className="input"
                      placeholder="https://example.com/image.jpg"
                      required
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                      Recommended: 1200x400px for home banners (3:1 ratio), max 5MB
                    </p>
                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ fontSize: '0.875rem', color: 'var(--gray-600)', display: 'block', marginBottom: '0.5rem' }}>Or upload a file:</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/webm"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="input"
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          cursor: uploading ? 'not-allowed' : 'pointer',
                          background: uploading ? 'var(--gray-100)' : 'var(--gray-50)',
                          border: '2px dashed var(--gray-300)',
                          opacity: uploading ? 0.6 : 1
                        }}
                      >
                        {uploading ? '📤 Uploading...' : '📁 Choose File (Max 5MB)'}
                      </label>
                    </div>
                  </div>

                  {activeTab === 'banners' && (
                    <>
                      <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Target URL (Optional)</label>
                        <input
                          type="url"
                          value={bannerFormData.targetUrl || ''}
                          onChange={(e) => setBannerFormData({...bannerFormData, targetUrl: e.target.value})}
                          className="input"
                          placeholder="https://example.com/promotion"
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                          {bannerFormData.targetUrl ? '✓ Banner will be clickable' : 'Leave empty for non-clickable banners'}
                        </p>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Target Sections *</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {sections.map(section => (
                            <button
                              key={section}
                              type="button"
                              onClick={() => toggleSection(section)}
                              className="badge"
                              style={{
                                cursor: 'pointer',
                                background: bannerFormData.targetSection.includes(section) ? 'var(--primary)' : 'var(--gray-200)',
                                color: bannerFormData.targetSection.includes(section) ? 'white' : 'var(--gray-700)'
                              }}
                            >
                              {section}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={activeTab === 'banners' ? bannerFormData.isActive : onboardingFormData.isActive}
                      onChange={(e) => activeTab === 'banners'
                        ? setBannerFormData({...bannerFormData, isActive: e.target.checked})
                        : setOnboardingFormData({...onboardingFormData, isActive: e.target.checked})
                      }
                      style={{ width: '16px', height: '16px' }}
                    />
                    <label className="label" style={{ marginBottom: 0 }}>Active</label>
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div>
                  <label className="label">Live Preview</label>
                  <div className="card" style={{ minHeight: '400px' }}>
                    {previewUrl ? (
                      activeTab === 'banners' ? (
                        <div>
                          {bannerFormData.mediaType === 'image' && (
                            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
                          )}
                          {bannerFormData.mediaType === 'video' && (
                            <video src={previewUrl} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} controls />
                          )}
                          <div style={{ padding: '1rem' }}>
                            <h3 style={{ fontWeight: '600' }}>{bannerFormData.title || 'Banner Title'}</h3>
                            {bannerFormData.description && (
                              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>{bannerFormData.description}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: '1.5rem',
                          minHeight: '400px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          background: onboardingFormData.backgroundColor,
                          borderRadius: '8px'
                        }}>
                          <img
                            src={previewUrl}
                            alt="Preview"
                            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', marginBottom: '1.5rem' }}
                          />
                          <h2 style={{
                            fontWeight: 'bold',
                            marginBottom: '0.75rem',
                            color: onboardingFormData.textColor,
                            fontSize: `${onboardingFormData.metadata.titleFontSize}px`,
                            textAlign: onboardingFormData.metadata.alignment
                          }}>
                            {onboardingFormData.title || 'Slide Title'}
                          </h2>
                          <p style={{
                            color: onboardingFormData.textColor,
                            fontSize: `${onboardingFormData.metadata.descriptionFontSize}px`,
                            textAlign: onboardingFormData.metadata.alignment
                          }}>
                            {onboardingFormData.description || 'Slide description goes here...'}
                          </p>
                        </div>
                      )
                    ) : (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                        Enter a media URL to see preview
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
                <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Update' : 'Create'}
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