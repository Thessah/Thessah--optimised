'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, Edit2, ImageIcon, Eye, EyeOff, Save, X } from 'lucide-react'
import Image from 'next/image'

export default function StoreHeroBannersPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    badge: '',
    subtitle: '',
    title: '',
    description: '',
    cta: '',
    link: '/shop',
    image: '',
    mobileImage: '',
    isActive: true,
    showTitle: true,
    showSubtitle: true,
    showBadge: true,
    showButton: true
  })

  // Fetch banners on component mount
  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      console.log('Fetching banners from /api/store/hero-banners...');
      const res = await axios.get('/api/store/hero-banners')
      console.log('Response received:', res.data);
      if (res.data && typeof res.data === 'object') {
        setBanners(res.data.banners || [])
      } else {
        console.error('Invalid response format:', res.data);
        setBanners([])
      }
    } catch (error) {
      console.error('Error fetching banners:', error.response?.data || error.message)
      setBanners([])
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch banners: ' + (error.response?.data?.error || error.message))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formDataObj = new FormData()
      formDataObj.append('file', file)

      console.log('Uploading file:', file.name, file.size);
      const res = await axios.post('/api/store/upload-banner', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      console.log('Upload response:', res.data);
      if (res.data.success && res.data.url) {
        setFormData(prev => ({
          ...prev,
          image: res.data.url
        }))
        toast.success('Image uploaded successfully!')
        // Clear the file input
        e.target.value = ''
      } else {
        toast.error('Upload failed: ' + (res.data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message)
      toast.error('Failed to upload image: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title) {
      toast.error('Title is required')
      return
    }

    if (!formData.image) {
      toast.error('Banner image is required (paste URL or upload file)')
      return
    }

    try {
      setSubmitting(true)

      if (editingBanner) {
        await axios.put('/api/store/hero-banners', {
          bannerId: editingBanner._id,
          ...formData
        })
        toast.success('Banner updated successfully')
      } else {
        const res = await axios.post('/api/store/hero-banners', formData)
        if (res.data.warning) {
          toast.success(res.data.message);
        } else {
          toast.success('Banner created successfully')
        }
      }

      resetForm()
      fetchBanners()
    } catch (error) {
      console.error('Error saving banner:', error)
      toast.error(error.response?.data?.error || 'Failed to save banner')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setFormData({
      badge: banner.badge || '',
      subtitle: banner.subtitle || '',
      title: banner.title || '',
      description: banner.description || '',
      cta: banner.cta || '',
      link: banner.link || '/shop',
      image: banner.image || '',
      mobileImage: banner.mobileImage || '',
      isActive: banner.isActive !== undefined ? banner.isActive : true,
      showTitle: banner.showTitle !== undefined ? banner.showTitle : true,
      showSubtitle: banner.showSubtitle !== undefined ? banner.showSubtitle : true,
      showBadge: banner.showBadge !== undefined ? banner.showBadge : true,
      showButton: banner.showButton !== undefined ? banner.showButton : true
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      await axios.delete(`/api/store/hero-banners?bannerId=${id}`)
      toast.success('Banner deleted successfully')
      fetchBanners()
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('Failed to delete banner')
    }
  }

  const toggleActive = async (banner) => {
    try {
      await axios.put('/api/store/hero-banners', {
        bannerId: banner._id,
        isActive: !banner.isActive
      })
      toast.success(`Banner ${!banner.isActive ? 'activated' : 'deactivated'}`)
      fetchBanners()
    } catch (error) {
      console.error('Error toggling banner:', error)
      toast.error('Failed to update banner status')
    }
  }

  const resetForm = () => {
    setFormData({
      badge: '',
      subtitle: '',
      title: '',
      description: '',
      cta: '',
      link: '/shop',
      image: '',
      mobileImage: '',
      isActive: true,
      showTitle: true,
      showSubtitle: true,
      showBadge: true,
      showButton: true
    })
    setEditingBanner(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hero Banners</h1>
          <p className="text-gray-600 mt-1">Manage your store's hero banner slider</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Banner
          </button>
        )}
      </div>

      {/* Banner Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingBanner ? 'Edit Banner' : 'Add New Banner'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Your old gold."
                  required
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="India's new strength"
                />
              </div>

              {/* Badge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge Text
                </label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0% deduction on exchange"
                />
              </div>

              {/* CTA Button */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button Text <span className="text-xs text-gray-500">(leave empty to hide)</span>
                </label>
                <input
                  type="text"
                  name="cta"
                  value={formData.cta}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="SHOP NOW (optional)"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button Link
                </label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="/shop"
                />
              </div>

              {/* Image URL or Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Image <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Choose ONE option:</p>
                
                <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  {/* URL Input */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Option 1: Paste Image URL</label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  {/* File Upload */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Option 2: Upload Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {uploading ? '⏳ Uploading...' : '(JPG, PNG, WebP)'}
                    </p>
                  </div>

                  {/* Preview */}
                  {formData.image && formData.image.startsWith('http') && (
                    <div className="mt-3 p-3 bg-white rounded border border-green-200">
                      <p className="text-xs text-green-600 font-medium mb-2">✓ Desktop Image Selected:</p>
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => console.error('Image load error:', e)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Image URL or Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Banner Image <span className="text-xs text-gray-500">(optional - falls back to desktop)</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">Recommended: 600x800px (3:4 portrait)</p>
                
                <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  {/* URL Input */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Option 1: Paste Mobile Image URL</label>
                    <input
                      type="text"
                      name="mobileImage"
                      value={formData.mobileImage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="https://example.com/mobile-image.jpg"
                    />
                  </div>
                  
                  {/* File Upload */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Option 2: Upload Mobile Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setUploading(true)
                          const formDataObj = new FormData()
                          formDataObj.append('file', file)
                          const res = await axios.post('/api/store/upload-banner', formDataObj, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          })
                          if (res.data.success && res.data.url) {
                            setFormData(prev => ({ ...prev, mobileImage: res.data.url }))
                            toast.success('Mobile image uploaded!')
                            e.target.value = ''
                          }
                        } catch (error) {
                          toast.error('Failed to upload mobile image')
                        } finally {
                          setUploading(false)
                        }
                      }}
                      disabled={uploading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {uploading ? '⏳ Uploading...' : '(JPG, PNG, WebP)'}
                    </p>
                  </div>

                  {/* Preview */}
                  {formData.mobileImage && formData.mobileImage.startsWith('http') && (
                    <div className="mt-3 p-3 bg-white rounded border border-green-200">
                      <p className="text-xs text-green-600 font-medium mb-2">✓ Mobile Image Selected:</p>
                      <img
                        src={formData.mobileImage}
                        alt="Mobile Preview"
                        className="w-36 h-48 object-cover rounded mx-auto"
                        onError={(e) => console.error('Image load error:', e)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Display Toggles */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Show/Hide Elements</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showTitle"
                    name="showTitle"
                    checked={formData.showTitle}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="showTitle" className="text-sm text-gray-700">Show Title</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showSubtitle"
                    name="showSubtitle"
                    checked={formData.showSubtitle}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="showSubtitle" className="text-sm text-gray-700">Show Subtitle</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showBadge"
                    name="showBadge"
                    checked={formData.showBadge}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="showBadge" className="text-sm text-gray-700">Show Badge</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showButton"
                    name="showButton"
                    checked={formData.showButton}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="showButton" className="text-sm text-gray-700">Show Button</label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Help India reduce gold imports by exchanging your old gold for new jewellery..."
              />
            </div>

            {/* Image Preview */}
            {formData.image && formData.image.startsWith('http') && (
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    toast.error('Invalid image URL');
                  }}
                />
              </div>
            )}

            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active (Show on website)
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors disabled:bg-gray-400"
              >
                <Save className="w-5 h-5" />
                {submitting ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No banners yet</h3>
            <p className="text-gray-600 mb-4">Create your first hero banner to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Banner
            </button>
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner._id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* Banner Image */}
                <div className="relative w-full md:w-1/3 h-48 bg-gray-100">
                  {banner.image ? (
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {banner.isActive ? (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Banner Details */}
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {banner.badge && (
                        <span className="inline-block text-xs text-red-600 border border-red-600 px-2 py-0.5 rounded-full mb-2">
                          {banner.badge}
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-gray-900">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-sm text-gray-600">{banner.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {banner.description && (
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {banner.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded text-xs font-semibold">
                      {banner.cta || 'SHOP NOW'}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="text-blue-600">{banner.link || '/shop'}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(banner)}
                      className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      {banner.isActive ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(banner._id)}
                      className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
