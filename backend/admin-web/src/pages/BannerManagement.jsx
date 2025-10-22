import { useState, useEffect } from 'react';
import api from '../services/api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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

  // Banner form data
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

  // Onboarding form data
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
        setBanners(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load banners:', error);
    }
  };

  const loadOnboardingSlides = async () => {
    try {
      const response = await api.get('/admin/onboarding');
      if (response.data.success) {
        setOnboardingSlides(response.data.data);
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Banner & Carousel Management</h1>
        <p className="text-gray-600 mt-1">Manage promotional banners, carousels, and onboarding slides</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('banners')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'banners'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Banners & Carousels
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'onboarding'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Onboarding Slides
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>
        {activeTab === 'banners' && (
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="all">All Sections</option>
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        )}
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 whitespace-nowrap"
        >
          + Create {activeTab === 'banners' ? 'Banner' : 'Slide'}
        </button>
      </div>

      {/* Notification Hints */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 text-xl">💡</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Quick Tips:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              {activeTab === 'banners' ? (
                <>
                  <li>• Use higher weight values (50-100) for priority banners</li>
                  <li>• Target specific sections (home-top, airtime, data) for contextual ads</li>
                  <li>• Schedule banners with activeFrom/activeTo dates for campaigns</li>
                  <li>• Track performance with click and impression metrics</li>
                </>
              ) : (
                <>
                  <li>• Drag and drop slides to reorder the onboarding carousel</li>
                  <li>• Use high-quality images (recommended: 1080x1920)</li>
                  <li>• Keep titles short and descriptions concise</li>
                  <li>• Test on different screen sizes for best results</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Loading...
        </div>
      ) : activeTab === 'banners' ? (
        /* Banner List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBanners.map((banner) => (
            <div key={banner._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {banner.mediaType === 'image' && (
                <img
                  src={banner.mediaUrl}
                  alt={banner.title}
                  className="w-full h-48 object-cover"
                />
              )}
              {banner.mediaType === 'video' && (
                <video src={banner.mediaUrl} className="w-full h-48 object-cover" controls />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg flex-1">{banner.title}</h3>
                  <button
                    onClick={() => toggleBannerStatus(banner._id, banner.isActive)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      banner.isActive 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {banner.isActive ? '✓ Active' : '○ Inactive'}
                  </button>
                </div>
                {banner.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{banner.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-3">
                  {banner.targetSection.map(section => (
                    <span key={section} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {section}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs text-gray-500">
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">{banner.weight}</div>
                    <div>Weight</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">{banner.clickCount || 0}</div>
                    <div>Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700">{banner.impressionCount || 0}</div>
                    <div>Views</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => editBanner(banner)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteBanner(banner._id)}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredBanners.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No banners found. Create your first banner to get started!
            </div>
          )}
        </div>
      ) : (
        /* Onboarding Slides List with Drag and Drop */
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="slides">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {filteredSlides.map((slide, index) => (
                  <Draggable key={slide._id} draggableId={slide._id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
                          snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <div className="flex">
                          <div
                            {...provided.dragHandleProps}
                            className="flex items-center justify-center w-12 bg-gray-50 cursor-move hover:bg-gray-100"
                          >
                            <span className="text-gray-400">⋮⋮</span>
                          </div>
                          <div className="flex-1 p-4 flex items-center gap-4">
                            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                              <img
                                src={slide.mediaUrl}
                                alt={slide.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{slide.title}</h3>
                                  <p className="text-sm text-gray-600 line-clamp-2">{slide.description}</p>
                                </div>
                                <button
                                  onClick={() => toggleOnboardingStatus(slide._id, slide.isActive)}
                                  className={`ml-3 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                    slide.isActive 
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                >
                                  {slide.isActive ? '✓ Active' : '○ Inactive'}
                                </button>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                <span className="px-2 py-1 bg-gray-100 rounded">Order: {slide.order}</span>
                                <span>BG: {slide.backgroundColor}</span>
                                <span>Text: {slide.textColor}</span>
                                <span className="capitalize">{slide.metadata?.alignment || 'center'} aligned</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => editOnboardingSlide(slide)}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteOnboardingSlide(slide._id)}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {filteredSlides.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No onboarding slides found. Create your first slide to get started!
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit' : 'Create'} {activeTab === 'banners' ? 'Banner' : 'Onboarding Slide'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <form onSubmit={activeTab === 'banners' ? handleBannerSubmit : handleOnboardingSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                      type="text"
                      value={activeTab === 'banners' ? bannerFormData.title : onboardingFormData.title}
                      onChange={(e) => activeTab === 'banners' 
                        ? setBannerFormData({...bannerFormData, title: e.target.value})
                        : setOnboardingFormData({...onboardingFormData, title: e.target.value})
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={activeTab === 'banners' ? bannerFormData.description : onboardingFormData.description}
                      onChange={(e) => activeTab === 'banners'
                        ? setBannerFormData({...bannerFormData, description: e.target.value})
                        : setOnboardingFormData({...onboardingFormData, description: e.target.value})
                      }
                      className="w-full border rounded-lg px-3 py-2"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Media Type</label>
                      <select
                        value={activeTab === 'banners' ? bannerFormData.mediaType : onboardingFormData.mediaType}
                        onChange={(e) => activeTab === 'banners'
                          ? setBannerFormData({...bannerFormData, mediaType: e.target.value})
                          : setOnboardingFormData({...onboardingFormData, mediaType: e.target.value})
                        }
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="gif">GIF</option>
                      </select>
                    </div>

                    {activeTab === 'banners' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Weight (Priority)</label>
                        <input
                          type="number"
                          value={bannerFormData.weight}
                          onChange={(e) => setBannerFormData({...bannerFormData, weight: parseInt(e.target.value)})}
                          className="w-full border rounded-lg px-3 py-2"
                          min="0"
                          max="100"
                        />
                      </div>
                    )}

                    {activeTab === 'onboarding' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Order</label>
                        <input
                          type="number"
                          value={onboardingFormData.order}
                          onChange={(e) => setOnboardingFormData({...onboardingFormData, order: parseInt(e.target.value)})}
                          className="w-full border rounded-lg px-3 py-2"
                          min="0"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Media URL *</label>
                    <input
                      type="url"
                      value={activeTab === 'banners' ? bannerFormData.mediaUrl : onboardingFormData.mediaUrl}
                      onChange={(e) => handleMediaUrlChange(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="https://example.com/image.jpg"
                      required
                    />
                  </div>

                  {activeTab === 'banners' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Target URL (Optional)</label>
                        <input
                          type="url"
                          value={bannerFormData.targetUrl}
                          onChange={(e) => setBannerFormData({...bannerFormData, targetUrl: e.target.value})}
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
                              className={`px-3 py-2 rounded-lg text-sm ${
                                bannerFormData.targetSection.includes(section)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                            value={bannerFormData.activeFrom}
                            onChange={(e) => setBannerFormData({...bannerFormData, activeFrom: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Active To</label>
                          <input
                            type="datetime-local"
                            value={bannerFormData.activeTo}
                            onChange={(e) => setBannerFormData({...bannerFormData, activeTo: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Background Color</label>
                          <input
                            type="color"
                            value={onboardingFormData.backgroundColor}
                            onChange={(e) => setOnboardingFormData({...onboardingFormData, backgroundColor: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2 h-10"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Text Color</label>
                          <input
                            type="color"
                            value={onboardingFormData.textColor}
                            onChange={(e) => setOnboardingFormData({...onboardingFormData, textColor: e.target.value})}
                            className="w-full border rounded-lg px-3 py-2 h-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Title Size</label>
                          <input
                            type="number"
                            value={onboardingFormData.metadata.titleFontSize}
                            onChange={(e) => setOnboardingFormData({
                              ...onboardingFormData,
                              metadata: {...onboardingFormData.metadata, titleFontSize: parseInt(e.target.value)}
                            })}
                            className="w-full border rounded-lg px-3 py-2"
                            min="12"
                            max="72"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Description Size</label>
                          <input
                            type="number"
                            value={onboardingFormData.metadata.descriptionFontSize}
                            onChange={(e) => setOnboardingFormData({
                              ...onboardingFormData,
                              metadata: {...onboardingFormData.metadata, descriptionFontSize: parseInt(e.target.value)}
                            })}
                            className="w-full border rounded-lg px-3 py-2"
                            min="10"
                            max="32"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Alignment</label>
                          <select
                            value={onboardingFormData.metadata.alignment}
                            onChange={(e) => setOnboardingFormData({
                              ...onboardingFormData,
                              metadata: {...onboardingFormData.metadata, alignment: e.target.value}
                            })}
                            className="w-full border rounded-lg px-3 py-2"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Button Text</label>
                        <input
                          type="text"
                          value={onboardingFormData.metadata.buttonText}
                          onChange={(e) => setOnboardingFormData({
                            ...onboardingFormData,
                            metadata: {...onboardingFormData.metadata, buttonText: e.target.value}
                          })}
                          className="w-full border rounded-lg px-3 py-2"
                          placeholder="Get Started"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={activeTab === 'banners' ? bannerFormData.isActive : onboardingFormData.isActive}
                      onChange={(e) => activeTab === 'banners'
                        ? setBannerFormData({...bannerFormData, isActive: e.target.checked})
                        : setOnboardingFormData({...onboardingFormData, isActive: e.target.checked})
                      }
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-medium">Active</label>
                  </div>
                </div>

                {/* Right Column - Live Preview */}
                <div className="lg:sticky lg:top-6">
                  <label className="block text-sm font-medium mb-2">Live Preview</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {previewUrl ? (
                      activeTab === 'banners' ? (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                          {bannerFormData.mediaType === 'image' && (
                            <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                          )}
                          {bannerFormData.mediaType === 'video' && (
                            <video src={previewUrl} className="w-full h-48 object-cover" controls />
                          )}
                          <div className="p-3">
                            <h3 className="font-semibold">{bannerFormData.title || 'Banner Title'}</h3>
                            {bannerFormData.description && (
                              <p className="text-sm text-gray-600 mt-1">{bannerFormData.description}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="rounded-lg p-6 min-h-[400px] flex flex-col justify-center"
                          style={{ backgroundColor: onboardingFormData.backgroundColor }}
                        >
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full max-h-48 object-contain mb-6"
                          />
                          <h2
                            className="font-bold mb-3"
                            style={{
                              color: onboardingFormData.textColor,
                              fontSize: `${onboardingFormData.metadata.titleFontSize}px`,
                              textAlign: onboardingFormData.metadata.alignment
                            }}
                          >
                            {onboardingFormData.title || 'Slide Title'}
                          </h2>
                          <p
                            style={{
                              color: onboardingFormData.textColor,
                              fontSize: `${onboardingFormData.metadata.descriptionFontSize}px`,
                              textAlign: onboardingFormData.metadata.alignment
                            }}
                          >
                            {onboardingFormData.description || 'Slide description goes here...'}
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        Enter a media URL to see preview
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
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