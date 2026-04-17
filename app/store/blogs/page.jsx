'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit2, Trash2, Plus, Eye, EyeOff, X, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/useAuth';

export default function AdminBlogs() {
  const { getToken } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sliderUploading, setSliderUploading] = useState(false);
  const [sliderBanners, setSliderBanners] = useState([]);
  const [sliderForm, setSliderForm] = useState({
    title: '',
    buttonText: '',
    buttonLink: '',
    backgroundImage: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    author: '',
    image: '',
    readTime: '',
    published: true,
    featuredInSlider: false,
    sliderButtonText: 'Read More',
    sliderButtonLink: ''
  });

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/blogs');
      if (response.data?.blogs) {
        setBlogs(response.data.blogs);
      }
    } catch (error) {
      toast.error('Failed to fetch blogs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSliderBanners = async () => {
    try {
      const response = await axios.get('/api/slider-banners');
      if (response.data?.banners) {
        setSliderBanners(response.data.banners);
      }
    } catch (error) {
      console.error('Error fetching slider banners:', error);
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchSliderBanners();
  }, []);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'title' && { slug: generateSlug(value) })
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.data?.url) {
        setFormData(prev => ({ ...prev, image: response.data.url }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/blogs/${editingId}`, formData);
        toast.success('Blog updated successfully');
      } else {
        await axios.post('/api/blogs', formData);
        toast.success('Blog created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: '',
        author: '',
        image: '',
        readTime: '',
        published: true
      });
      fetchBlogs();
    } catch (error) {
      toast.error(editingId ? 'Failed to update blog' : 'Failed to create blog');
      console.error(error);
    }
  };

  const handleEdit = (blog) => {
    setFormData(blog);
    setEditingId(blog._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await axios.delete(`/api/blogs/${id}`);
      toast.success('Blog deleted successfully');
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to delete blog');
      console.error(error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      author: '',
      image: '',
      readTime: '',
      published: true,
      featuredInSlider: false,
      sliderButtonText: 'Read More',
      sliderButtonLink: ''
    });
  };

  const handleSliderImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setSliderUploading(true);
      const token = await getToken();
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await axios.post('/api/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (response.data?.url) {
        setSliderForm(prev => ({ ...prev, backgroundImage: response.data.url }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setSliderUploading(false);
    }
  };

  const handleAddSliderBanner = async () => {
    if (!sliderForm.title || !sliderForm.buttonLink || !sliderForm.backgroundImage) {
      toast.error('Please fill in all fields and upload an image');
      return;
    }

    try {
      setSliderUploading(true);
      const response = await axios.post('/api/slider-banners', {
        title: sliderForm.title,
        buttonText: sliderForm.buttonText || 'Shop Now',
        buttonLink: sliderForm.buttonLink,
        backgroundImage: sliderForm.backgroundImage
      });

      if (response.data?.success) {
        setSliderBanners([...sliderBanners, response.data.banner]);
        setSliderForm({
          title: '',
          buttonText: '',
          buttonLink: '',
          backgroundImage: ''
        });
        toast.success('Banner added to slider');
      }
    } catch (error) {
      console.error('Error adding banner:', error);
      toast.error('Failed to add banner');
    } finally {
      setSliderUploading(false);
    }
  };

  const handleRemoveSliderBanner = async (id) => {
    if (!window.confirm('Are you sure you want to remove this banner?')) return;
    
    try {
      const response = await axios.delete(`/api/slider-banners/${id}`);
      if (response.data?.success) {
        setSliderBanners(sliderBanners.filter(banner => banner._id !== id));
        toast.success('Banner removed from slider');
      }
    } catch (error) {
      console.error('Error removing banner:', error);
      toast.error('Failed to remove banner');
    }
  };

  return (
    <div className="text-gray-700 mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Content Management</p>
          <h1 className="text-2xl font-semibold">Blog Articles</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Add Article
          </button>
        </div>
      </div>

      {/* Slider Management Section */}
      <div data-section="slider" className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              📸 Hero Slider Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">Create & manage featured slider banners</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                placeholder="Slider banner title"
                value={sliderForm.title}
                onChange={(e) => setSliderForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
              <input
                type="text"
                placeholder="e.g., Shop Now, Explore, Learn More"
                value={sliderForm.buttonText}
                onChange={(e) => setSliderForm(prev => ({ ...prev, buttonText: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Link</label>
              <input
                type="text"
                placeholder="e.g., /shop, /category/gold"
                value={sliderForm.buttonLink}
                onChange={(e) => setSliderForm(prev => ({ ...prev, buttonLink: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSliderImageUpload}
                  disabled={sliderUploading}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-600"
                />
                {sliderForm.backgroundImage && (
                  <img 
                    src={sliderForm.backgroundImage} 
                    alt="preview" 
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={handleAddSliderBanner}
            disabled={sliderUploading || !sliderForm.title}
            className="mt-4 w-full bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sliderUploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {sliderUploading ? 'Uploading...' : 'Add to Slider'}
          </button>
        </div>

        {/* Active Sliders */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Featured Slider Banners</h3>
          {sliderBanners.length === 0 ? (
            <p className="text-sm text-gray-500">No custom banners added yet. Create one above or check "Featured in Slider" when editing articles.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {sliderBanners.map((banner) => (
                <div key={banner._id} className="relative group rounded-lg overflow-hidden h-48 bg-gray-200">
                  {banner.backgroundImage && (
                    <img 
                      src={banner.backgroundImage} 
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex flex-col justify-between p-3">
                    <div>
                      <h4 className="text-white font-semibold text-sm">{banner.title}</h4>
                      {banner.buttonText && (
                        <p className="text-white text-xs mt-1">{banner.buttonText}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveSliderBanner(banner._id)}
                      className="w-full bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition flex items-center justify-center gap-1"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Edit Article' : 'Create New Article'}
              </h2>
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Wedding, Care Guide, Trends"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Author</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Excerpt *</label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Brief summary of the article"
                  rows="2"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Full article content (supports basic HTML)"
                  rows="6"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Read Time (minutes)</label>
                  <input
                    type="number"
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Featured Image</label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="blog-image-upload"
                    />
                    <label
                      htmlFor="blog-image-upload"
                      className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition ${
                        uploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          <span className="text-sm">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={20} />
                          <span className="text-sm">Upload Image</span>
                        </>
                      )}
                    </label>
                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {formData.image && (
                    <div className="relative w-full h-48 border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Or paste an image URL above. Max 5MB. Recommended: 1200x630px
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  name="published"
                  checked={formData.published}
                  onChange={handleInputChange}
                  className="w-4 h-4"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Publish immediately
                </label>
              </div>

              {/* Slider Settings */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Slider Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featuredInSlider"
                      name="featuredInSlider"
                      checked={formData.featuredInSlider}
                      onChange={handleInputChange}
                      className="w-4 h-4"
                    />
                    <label htmlFor="featuredInSlider" className="text-sm font-medium">
                      Featured in Slider (top 3 articles)
                    </label>
                  </div>

                  {formData.featuredInSlider && (
                    <div className="grid md:grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium mb-1">Slider Button Text</label>
                        <input
                          type="text"
                          name="sliderButtonText"
                          value={formData.sliderButtonText}
                          onChange={handleInputChange}
                          placeholder="e.g., Read More"
                          className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Slider Button Link</label>
                        <input
                          type="text"
                          name="sliderButtonLink"
                          value={formData.sliderButtonLink}
                          onChange={handleInputChange}
                          placeholder="e.g., /blog/article-slug"
                          className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {editingId ? 'Update Article' : 'Create Article'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blog List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading articles...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No articles yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create your first article
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-sm">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-sm">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-sm">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-sm">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-sm">Date</th>
                <th className="text-center px-4 py-3 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium">{blog.title}</td>
                  <td className="px-4 py-3 text-sm">
                    {blog.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {blog.category}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{blog.author || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`flex items-center gap-1 ${blog.published ? 'text-green-600' : 'text-gray-500'}`}>
                      {blog.published ? <Eye size={16} /> : <EyeOff size={16} />}
                      {blog.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center space-x-2 flex items-center justify-center">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
