'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PageTitle from '@/components/PageTitle'

const DEFAULT_HEADING = {
  title: 'For an Auspicious Beginning',
  subtitle: 'Discover our most-loved designs, curated for this Akshaya Tritiya',
  image: '',
  visible: true
}

export default function Section8Settings() {
  const [heading, setHeading] = useState(DEFAULT_HEADING)
  const [categories, setCategories] = useState([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([])
  const [selectedCategoryNames, setSelectedCategoryNames] = useState([])
  const [editingHeading, setEditingHeading] = useState(false)
  const [editingCategories, setEditingCategories] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, settingsRes] = await Promise.all([
        axios.get('/api/store/categories'),
        axios.get('/api/store/settings')
      ])

      const parentCategories = (categoriesRes.data?.categories || []).filter((cat) => !cat.parentId)
      setCategories(parentCategories)

      const settings = settingsRes.data?.settings || {}
      if (settings.section8Heading) {
        setHeading((prev) => ({ ...prev, ...settings.section8Heading }))
      }

      const display = settings.section8Display || {}
      const ids = Array.isArray(display.selectedCategoryIds) ? display.selectedCategoryIds.map(String) : []
      const names = Array.isArray(display.selectedCategoryNames) ? display.selectedCategoryNames : []

      setSelectedCategoryIds(ids)
      setSelectedCategoryNames(names)
    } catch (error) {
      console.error('Error loading Section 8 settings:', error)
      toast.error('Failed to load Section 8 settings')
    }
  }

  const selectedCategoryCards = useMemo(() => {
    const selectedSet = new Set(selectedCategoryIds.map(String))
    return categories.filter((cat) => selectedSet.has(String(cat._id)))
  }, [categories, selectedCategoryIds])

  const handleImageUpload = async (file) => {
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/store/upload-banner', formData)
      const imageUrl = response.data?.url

      if (imageUrl) {
        setHeading((prev) => ({ ...prev, image: imageUrl }))
        toast.success('Image uploaded')
      }
    } catch (error) {
      console.error('Section 8 image upload failed:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const toggleCategory = (category) => {
    const id = String(category._id)
    const name = category.name || ''

    setSelectedCategoryIds((prevIds) => {
      if (prevIds.includes(id)) {
        return prevIds.filter((x) => x !== id)
      }
      return [...prevIds, id]
    })

    setSelectedCategoryNames((prevNames) => {
      const normalized = prevNames.map((x) => String(x).toLowerCase())
      if (normalized.includes(String(name).toLowerCase())) {
        return prevNames.filter((x) => String(x).toLowerCase() !== String(name).toLowerCase())
      }
      return [...prevNames, name]
    })
  }

  const saveHeading = async () => {
    setLoading(true)
    try {
      await axios.put('/api/store/settings', {
        section8Heading: heading
      })
      toast.success('Section 8 heading updated')
      setEditingHeading(false)
    } catch (error) {
      console.error('Error saving section 8 heading:', error)
      toast.error('Failed to save heading')
    } finally {
      setLoading(false)
    }
  }

  const saveCategories = async () => {
    setLoading(true)
    try {
      await axios.put('/api/store/settings', {
        section8Display: {
          selectedCategoryIds,
          selectedCategoryNames,
          order: selectedCategoryIds
        }
      })
      toast.success('Section 8 categories updated')
      setEditingCategories(false)
    } catch (error) {
      console.error('Error saving section 8 categories:', error)
      toast.error('Failed to save categories')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <PageTitle title="Section 8: Auspicious Products Carousel" />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Section 8 Display Notes</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>Select categories and homepage will show a mixed product carousel from those categories.</p>
            <p>Title, subtitle, and image are managed here.</p>
            <p>Recommended heading image size: 1200 x 360 px, max 5 MB.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Heading Content</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={heading.title}
                  onChange={(e) => setHeading((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={heading.subtitle}
                  onChange={(e) => setHeading((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heading Image URL</label>
                <input
                  type="text"
                  value={heading.image || ''}
                  onChange={(e) => setHeading((prev) => ({ ...prev, image: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Heading Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                  disabled={uploadingImage}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {uploadingImage && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={heading.visible !== false}
                  onChange={(e) => setHeading((prev) => ({ ...prev, visible: e.target.checked }))}
                  className="w-4 h-4"
                />
                Show Section 8 on homepage
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveHeading}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditingHeading(false)
                    fetchData()
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-xl font-serif text-gray-900">{heading.title || DEFAULT_HEADING.title}</h4>
              <p className="text-gray-600">{heading.subtitle || DEFAULT_HEADING.subtitle}</p>
              <p className="text-sm text-gray-500">Visibility: {heading.visible === false ? 'Hidden' : 'Visible'}</p>
              {heading.image && (
                <img
                  src={heading.image}
                  alt="Section 8 preview"
                  className="w-full max-w-xl h-36 object-cover rounded-lg border border-gray-200"
                />
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Category Selection (Mixed Products)</h3>
            {!editingCategories && (
              <button
                onClick={() => setEditingCategories(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit Selection
              </button>
            )}
          </div>

          {editingCategories ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Choose categories to mix in this carousel.</p>

              {categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {categories.map((category) => {
                    const id = String(category._id)
                    const isSelected = selectedCategoryIds.includes(id)

                    return (
                      <div
                        key={id}
                        onClick={() => toggleCategory(category)}
                        className={`p-4 rounded-lg cursor-pointer border-2 transition ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input type="checkbox" readOnly checked={isSelected} className="w-4 h-4 mt-1" />
                          <div className="min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{category.name}</h4>
                            {category.description && (
                              <p className="text-sm text-gray-500 truncate">{category.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-2">No categories available</p>
                  <p className="text-sm text-gray-400">Create categories first in the Categories page</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={saveCategories}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : `Save Selection (${selectedCategoryIds.length})`}
                </button>
                <button
                  onClick={() => {
                    setEditingCategories(false)
                    fetchData()
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {selectedCategoryCards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedCategoryCards.map((category) => (
                    <div key={String(category._id)} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      {category.image && (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-28 object-cover rounded-lg mb-2"
                        />
                      )}
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No categories selected. Click "Edit Selection" to choose.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
