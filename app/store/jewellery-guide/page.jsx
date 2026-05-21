'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import PageTitle from '@/components/PageTitle'

const defaultGuide = {
  enabled: true,
  hero: {
    title: 'Jewellery Guide',
    subtitle: 'Learn how to choose, style, and care for your jewellery.',
    image: ''
  },
  intro: '',
  sections: [
    {
      title: 'How to Choose Jewellery',
      content: '',
      image: '',
      visible: true
    }
  ],
  faqs: [
    {
      question: 'How do I clean gold jewellery?',
      answer: ''
    }
  ]
}

export default function JewelleryGuideAdminPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingSectionIndex, setUploadingSectionIndex] = useState(null)
  const [guide, setGuide] = useState(defaultGuide)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await axios.get('/api/store/settings')
        const incoming = data?.settings?.jewelleryGuide || {}
        setGuide({
          ...defaultGuide,
          ...incoming,
          hero: { ...defaultGuide.hero, ...(incoming.hero || {}) },
          sections: (incoming.sections || defaultGuide.sections).map((section) => ({
            title: section.title || '',
            content: section.content || '',
            image: section.image || '',
            visible: section.visible !== false
          })),
          faqs: (incoming.faqs || defaultGuide.faqs).map((faq) => ({
            question: faq.question || '',
            answer: faq.answer || ''
          }))
        })
      } catch (error) {
        console.error(error)
        toast.error('Failed to load jewellery guide settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleHeroChange = (field, value) => {
    setGuide((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: value
      }
    }))
  }

  const handleSectionChange = (index, field, value) => {
    setGuide((prev) => {
      const updatedSections = [...prev.sections]
      updatedSections[index] = {
        ...updatedSections[index],
        [field]: value
      }
      return { ...prev, sections: updatedSections }
    })
  }

  const addSection = () => {
    setGuide((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { title: '', content: '', image: '', visible: true }
      ]
    }))
  }

  const removeSection = (index) => {
    setGuide((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index)
    }))
  }

  const handleFaqChange = (index, field, value) => {
    setGuide((prev) => {
      const updatedFaqs = [...prev.faqs]
      updatedFaqs[index] = {
        ...updatedFaqs[index],
        [field]: value
      }
      return { ...prev, faqs: updatedFaqs }
    })
  }

  const addFaq = () => {
    setGuide((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }]
    }))
  }

  const removeFaq = (index) => {
    setGuide((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, idx) => idx !== index)
    }))
  }

  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post('/api/store/upload-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return response?.data?.url || ''
  }

  const handleHeroImageUpload = async (file) => {
    if (!file) return
    try {
      setUploadingHero(true)
      const url = await uploadImage(file)
      if (url) {
        handleHeroChange('image', url)
        toast.success('Hero image uploaded')
      } else {
        toast.error('Upload failed')
      }
    } catch (error) {
      console.error(error)
      toast.error('Upload failed')
    } finally {
      setUploadingHero(false)
    }
  }

  const handleSectionImageUpload = async (index, file) => {
    if (!file) return
    try {
      setUploadingSectionIndex(index)
      const url = await uploadImage(file)
      if (url) {
        handleSectionChange(index, 'image', url)
        toast.success('Section image uploaded')
      } else {
        toast.error('Upload failed')
      }
    } catch (error) {
      console.error(error)
      toast.error('Upload failed')
    } finally {
      setUploadingSectionIndex(null)
    }
  }

  const saveGuide = async () => {
    try {
      setSaving(true)
      await axios.put('/api/store/settings', {
        jewelleryGuide: guide
      })
      toast.success('Jewellery guide saved')
    } catch (error) {
      console.error(error)
      toast.error('Failed to save jewellery guide')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading settings...</p>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageTitle title="Jewellery Guide" />

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Jewellery Guide Content</h2>
            <p className="text-sm text-slate-600">Manage content shown on /jewellery-guide.</p>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={guide.enabled}
              onChange={(e) => setGuide((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700">
              {guide.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        <div className="border border-slate-200 rounded-lg p-4 space-y-3">
          <h3 className="text-base font-semibold text-slate-900">Hero Section</h3>
          <input
            type="text"
            value={guide.hero.title}
            onChange={(e) => handleHeroChange('title', e.target.value)}
            placeholder="Hero title"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
          <input
            type="text"
            value={guide.hero.subtitle}
            onChange={(e) => handleHeroChange('subtitle', e.target.value)}
            placeholder="Hero subtitle"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <input
              type="text"
              value={guide.hero.image}
              onChange={(e) => handleHeroChange('image', e.target.value)}
              placeholder="Hero image URL"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <label className="block w-full cursor-pointer">
              <span className="block w-full text-center text-xs px-2 py-2 bg-slate-100 hover:bg-slate-200 rounded border border-dashed border-slate-300">
                {uploadingHero ? 'Uploading...' : 'Upload hero image'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleHeroImageUpload(e.target.files?.[0])}
              />
            </label>
          </div>
          {guide.hero.image && (
            <img src={guide.hero.image} alt="Hero preview" className="w-full max-w-md h-44 object-cover rounded border border-slate-200" />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-semibold text-slate-900">Intro</h3>
          <textarea
            rows={4}
            value={guide.intro}
            onChange={(e) => setGuide((prev) => ({ ...prev, intro: e.target.value }))}
            placeholder="Write intro content"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Guide Sections</h3>
            <button
              type="button"
              onClick={addSection}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add Section
            </button>
          </div>

          {guide.sections.map((section, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Section {index + 1}</p>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={section.visible !== false}
                      onChange={(e) => handleSectionChange(index, 'visible', e.target.checked)}
                      className="w-3.5 h-3.5"
                    />
                    Visible
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={section.title}
                onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                placeholder="Section title"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <textarea
                rows={4}
                value={section.content}
                onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                placeholder="Section content"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <input
                  type="text"
                  value={section.image}
                  onChange={(e) => handleSectionChange(index, 'image', e.target.value)}
                  placeholder="Section image URL"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
                <label className="block w-full cursor-pointer">
                  <span className="block w-full text-center text-xs px-2 py-2 bg-white hover:bg-slate-100 rounded border border-dashed border-slate-300">
                    {uploadingSectionIndex === index ? 'Uploading...' : 'Upload section image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSectionImageUpload(index, e.target.files?.[0])}
                  />
                </label>
              </div>
              {section.image && (
                <img src={section.image} alt="Section preview" className="w-full max-w-sm h-36 object-cover rounded border border-slate-200" />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">FAQs</h3>
            <button
              type="button"
              onClick={addFaq}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add FAQ
            </button>
          </div>

          {guide.faqs.map((faq, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">FAQ {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
              <input
                type="text"
                value={faq.question}
                onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                placeholder="Question"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <textarea
                rows={3}
                value={faq.answer}
                onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                placeholder="Answer"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={saveGuide}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Jewellery Guide'}
          </button>
        </div>
      </div>
    </div>
  )
}
