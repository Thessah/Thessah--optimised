'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PageTitle from '@/components/PageTitle'

export default function Section4Settings() {
  const [heading, setHeading] = useState({
    title: 'Thessah World',
    subtitle: 'A companion for every occasion'
  })
  const [collections, setCollections] = useState([
    { title: '', image: '', link: '' },
    { title: '', image: '', link: '' },
    { title: '', image: '', link: '' },
    { title: '', image: '', link: '' }
  ])
  const [editingHeading, setEditingHeading] = useState(false)
  const [editingCollections, setEditingCollections] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await axios.get('/api/store/settings');
      console.log('📥 Section 4 Settings loaded:', settingsRes.data.settings?.section4Collections)

      // Load heading from settings
      if (settingsRes.data.settings?.section4Heading) {
        setHeading(settingsRes.data.settings.section4Heading)
      }

      // Load collections
      if (settingsRes.data.settings?.section4Collections) {
        setCollections(settingsRes.data.settings.section4Collections)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const handleSaveHeading = async () => {
    setLoading(true)
    try {
      const { data } = await axios.put('/api/store/settings', {
        section4Heading: heading
      })
      
      if (data.success) {
        toast.success('Section 4 heading updated!')
        setEditingHeading(false)
      }
    } catch (error) {
      console.error('Error saving heading:', error)
      toast.error('Failed to save heading')
    } finally {
      setLoading(false)
    }
  }

  const handleCollectionChange = (index, field, value) => {
    const updated = [...collections]
    updated[index][field] = value
    setCollections(updated)
  }

  const handleImageUpload = async (index, file) => {
    if (!file) return

    setUploadingIndex(index)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/store/upload-banner', formData)

      if (response.data.url) {
        handleCollectionChange(index, 'image', response.data.url)
        toast.success('Image uploaded successfully')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploadingIndex(null)
    }
  }

  const saveCollections = async () => {
    setLoading(true)
    try {
      console.log('💾 Saving collections:', collections)
      const response = await axios.put('/api/store/settings', {
        section4Collections: collections
      })
      console.log('✅ Save response:', response.data)
      toast.success('Collections updated')
      setEditingCollections(false)
      fetchData()
    } catch (error) {
      console.error('Error saving collections:', error)
      toast.error('Failed to save collections')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <PageTitle title="Section 4 Settings (Collections)" />

        {/* Heading Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Section Heading</h3>
            {!editingHeading && (
              <button
                onClick={() => setEditingHeading(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editingHeading ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={heading.title}
                  onChange={(e) => setHeading(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={heading.subtitle}
                  onChange={(e) => setHeading(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveHeading}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingHeading(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-xl font-serif text-gray-900 mb-1">{heading.title}</h4>
              <p className="text-gray-600">{heading.subtitle}</p>
            </div>
          )}
        </div>

        {/* Collections Management */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Collections (4 Items)</h3>
            {!editingCollections && (
              <button
                onClick={() => setEditingCollections(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editingCollections ? (
            <div className="space-y-6">
              {collections.map((collection, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Collection {index + 1}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={collection.title}
                        onChange={(e) => handleCollectionChange(index, 'title', e.target.value)}
                        placeholder="e.g., Wedding, Diamond, Gold"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image Upload
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(index, e.target.files[0])}
                          disabled={uploadingIndex === index}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {uploadingIndex === index && (
                          <p className="text-sm text-blue-600">Uploading...</p>
                        )}
                        {collection.image && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">Preview:</p>
                            <img 
                              src={collection.image} 
                              alt={collection.title || 'Preview'}
                              className="w-full h-40 object-cover rounded-lg"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link URL
                      </label>
                      <input
                        type="text"
                        value={collection.link}
                        onChange={(e) => handleCollectionChange(index, 'link', e.target.value)}
                        placeholder="/category/wedding or /shop?category=wedding"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={saveCollections}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Collections'}
                </button>
                <button
                  onClick={() => setEditingCollections(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collections.map((collection, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  {collection.image && (
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-full h-48 object-cover rounded-lg mb-2"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                  <h4 className="font-medium text-gray-900">{collection.title || `Collection ${index + 1}`}</h4>
                  {collection.link && (
                    <p className="text-sm text-gray-500 mt-1 truncate">{collection.link}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
