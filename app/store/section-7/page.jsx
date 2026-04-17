'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PageTitle from '@/components/PageTitle'

const DEFAULT_EXPERIENCES = [
  { title: 'VISIT OUR STORE', image: '', link: '/find-store' },
  { title: 'BOOK AN APPOINTMENT', image: '', link: '/book-appointment' },
  { title: 'TALK TO AN EXPERT', image: '', link: '/contact-expert' },
  { title: 'DIGI GOLD', image: '', link: '/digital-gold' },
  { title: 'BLOGS', image: '', link: '/blog' },
  { title: 'JEWELLERY GUIDE', image: '', link: '/jewellery-guide' }
]

const normalizeExperience = (exp = {}, fallback = {}) => ({
  title: exp.title ?? fallback.title ?? '',
  image: exp.image || exp.imageUrl || exp.bannerImage || fallback.image || '',
  link: exp.link ?? fallback.link ?? ''
})

export default function Section7Settings() {
  const [heading, setHeading] = useState({
    title: 'Thessah Experience',
    subtitle: 'Find a Boutique or Book a Consultation'
  })
  const [experiences, setExperiences] = useState(DEFAULT_EXPERIENCES)
  const [editingHeading, setEditingHeading] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await axios.get('/api/store/settings')
      console.log('📥 Section 7 Settings loaded:', settingsRes.data.settings)

      if (settingsRes.data.settings?.section7Heading) {
        setHeading(settingsRes.data.settings.section7Heading)
      }

      if (settingsRes.data.settings?.section7Experiences) {
        const saved = Array.isArray(settingsRes.data.settings.section7Experiences)
          ? settingsRes.data.settings.section7Experiences
          : []

        const normalized = DEFAULT_EXPERIENCES.map((fallback, index) =>
          normalizeExperience(saved[index], fallback)
        )

        setExperiences(normalized)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const handleHeadingChange = (field, value) => {
    setHeading(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleExperienceChange = (index, field, value) => {
    const updatedExperiences = [...experiences]
    updatedExperiences[index] = {
      ...updatedExperiences[index],
      [field]: value
    }
    setExperiences(updatedExperiences)
  }

  const handleImageUpload = async (index, file) => {
    if (!file) return

    setUploadingIndex(index)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/store/upload-banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.url) {
        handleExperienceChange(index, 'image', response.data.url)
        toast.success('Image uploaded successfully. Click Save to persist.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingIndex(null)
    }
  }

  const saveHeading = async () => {
    setLoading(true)
    try {
      console.log('💾 Saving Section 7 Heading:', heading)
      await axios.put('/api/store/settings', {
        section7Heading: heading
      })
      toast.success('Heading updated successfully')
      setEditingHeading(false)
      fetchData()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to update heading')
    } finally {
      setLoading(false)
    }
  }

  const saveExperience = async (index) => {
    if (uploadingIndex !== null) {
      toast.error('Please wait for image upload to finish before saving')
      return
    }

    setLoading(true)
    try {
      const payloadExperiences = experiences.map((exp, idx) =>
        normalizeExperience(exp, DEFAULT_EXPERIENCES[idx] || {})
      )

      console.log('💾 Saving Section 7 Experience:', payloadExperiences[index])
      await axios.put('/api/store/settings', {
        section7Experiences: payloadExperiences
      })
      toast.success('Experience updated successfully')
      setEditingIndex(null)
      fetchData()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to update experience')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageTitle title="Section 7: Thessah Experience" />

      {/* Section Heading */}
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
                Main Title
              </label>
              <input
                type="text"
                value={heading.title}
                onChange={(e) => handleHeadingChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Thessah Experience"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={heading.subtitle}
                onChange={(e) => handleHeadingChange('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Find a Boutique or Book a Consultation"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveHeading}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingHeading(false)
                  fetchData()
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Title:</span>
              <p className="text-gray-900">{heading.title}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Subtitle:</span>
              <p className="text-gray-900">{heading.subtitle}</p>
            </div>
          </div>
        )}
      </div>

      {/* Experiences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {experiences.map((experience, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Experience {index + 1}
              </h3>
              {editingIndex !== index && (
                <button
                  onClick={() => setEditingIndex(index)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Edit
                </button>
              )}
            </div>

            {editingIndex === index ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={experience.title}
                    onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(index, e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {uploadingIndex === index && (
                    <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                  )}
                  {experience.image && (
                    <img
                      src={experience.image}
                      alt={experience.title}
                      className="mt-2 w-full h-40 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL
                  </label>
                  <input
                    type="text"
                    value={experience.link}
                    onChange={(e) => handleExperienceChange(index, 'link', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="/find-store"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => saveExperience(index)}
                    disabled={loading || uploadingIndex === index}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadingIndex === index ? 'Uploading...' : loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingIndex(null)
                      fetchData()
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">Title:</span>
                  <p className="text-gray-900">{experience.title}</p>
                </div>
                {experience.image && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Image:</span>
                    <img
                      src={experience.image}
                      alt={experience.title}
                      className="mt-1 w-full h-40 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-600">Link:</span>
                  <p className="text-gray-900">{experience.link}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
