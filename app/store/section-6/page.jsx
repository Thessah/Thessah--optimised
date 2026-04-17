'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PageTitle from '@/components/PageTitle'

export default function Section6Settings() {
  const [settings, setSettings] = useState({
    backgroundColor: '#fef3c7', // amber-50
    leftSection: {
      title: '#GiftOfChoice',
      titleColor: '#dc2626', // red-600
      subtitle: "Breathtaking gifts for your loved one's",
      subtitleColor: '#374151', // gray-700
      price: 'STARTING AT AED10,000',
      priceColor: '#dc2626', // red-600
      buttonText: 'Explore Now',
      buttonLink: '/shop?collection=gifts',
      buttonColor: '#dc2626', // red-600
      buttonBgColor: '#dc2626' // red-600
    },
    rightSection: {
      branding: 'Thessah',
      brandingColor: '#f59e0b', // amber-500
      title: 'Exchange your Old Gold',
      titleColor: '#111827', // gray-900
      subtitle: 'for 100% Value!',
      subtitleColor: '#dc2626', // red-600
      description1: 'Unlock full value for your old gold today with',
      description1Color: '#2563eb', // blue-600
      description2: 'our Exchange Program!',
      description2Color: '#111827', // gray-900
      buttonText: 'Know more',
      buttonLink: '/exchange-gold',
      buttonColor: '#f59e0b', // amber-500
      buttonBgColor: '#f59e0b' // amber-500
    }
  })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await axios.get('/api/store/settings')
      console.log('📥 Section 6 Settings loaded:', settingsRes.data.settings?.section6PromotionBanner)

      if (settingsRes.data.settings?.section6PromotionBanner) {
        setSettings(settingsRes.data.settings.section6PromotionBanner)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const handleChange = (section, field, value) => {
    if (section === 'main') {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }))
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      console.log('💾 Saving section 6 settings:', settings)
      const response = await axios.put('/api/store/settings', {
        section6PromotionBanner: settings
      })
      console.log('✅ Save response:', response.data)
      toast.success('Promotion banner updated')
      setEditing(false)
      fetchData()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <PageTitle title="Section 6 Settings (Promotion Banner)" />

        {/* Settings Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Promotion Banner Settings</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-8">
              {/* Background Color */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Background Color</h4>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => handleChange('main', 'backgroundColor', e.target.value)}
                    className="w-20 h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={settings.backgroundColor}
                    onChange={(e) => handleChange('main', 'backgroundColor', e.target.value)}
                    placeholder="#fef3c7"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Left Section */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Left Section (Gift of Choice)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={settings.leftSection.title}
                      onChange={(e) => handleChange('leftSection', 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.leftSection.titleColor}
                        onChange={(e) => handleChange('leftSection', 'titleColor', e.target.value)}
                        className="w-20 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.leftSection.titleColor}
                        onChange={(e) => handleChange('leftSection', 'titleColor', e.target.value)}
                        placeholder="#dc2626"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={settings.leftSection.subtitle}
                      onChange={(e) => handleChange('leftSection', 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.leftSection.subtitleColor}
                        onChange={(e) => handleChange('leftSection', 'subtitleColor', e.target.value)}
                        className="w-20 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.leftSection.subtitleColor}
                        onChange={(e) => handleChange('leftSection', 'subtitleColor', e.target.value)}
                        placeholder="#374151"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Text
                    </label>
                    <input
                      type="text"
                      value={settings.leftSection.price}
                      onChange={(e) => handleChange('leftSection', 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.leftSection.priceColor}
                        onChange={(e) => handleChange('leftSection', 'priceColor', e.target.value)}
                        className="w-20 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.leftSection.priceColor}
                        onChange={(e) => handleChange('leftSection', 'priceColor', e.target.value)}
                        placeholder="#dc2626"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={settings.leftSection.buttonText}
                      onChange={(e) => handleChange('leftSection', 'buttonText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.leftSection.buttonColor}
                        onChange={(e) => handleChange('leftSection', 'buttonColor', e.target.value)}
                        className="w-20 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.leftSection.buttonColor}
                        onChange={(e) => handleChange('leftSection', 'buttonColor', e.target.value)}
                        placeholder="#dc2626"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={settings.leftSection.buttonLink}
                      onChange={(e) => handleChange('leftSection', 'buttonLink', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Right Section (Exchange Program)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branding Text
                    </label>
                    <input
                      type="text"
                      value={settings.rightSection.branding}
                      onChange={(e) => handleChange('rightSection', 'branding', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branding Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.rightSection.brandingColor}
                        onChange={(e) => handleChange('rightSection', 'brandingColor', e.target.value)}
                        className="w-20 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.rightSection.brandingColor}
                        onChange={(e) => handleChange('rightSection', 'brandingColor', e.target.value)}
                        placeholder="#f59e0b"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={settings.rightSection.title}
                      onChange={(e) => handleChange('rightSection', 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.rightSection.titleColor}
                        onChange={(e) => handleChange('rightSection', 'titleColor', e.target.value)}
                        className="w-20 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.rightSection.titleColor}
                        onChange={(e) => handleChange('rightSection', 'titleColor', e.target.value)}
                        placeholder="#111827"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={settings.rightSection.subtitle}
                      onChange={(e) => handleChange('rightSection', 'subtitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtitle Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.rightSection.subtitleColor}
                        onChange={(e) => handleChange('rightSection', 'subtitleColor', e.target.value)}
                        className="w-20 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.rightSection.subtitleColor}
                        onChange={(e) => handleChange('rightSection', 'subtitleColor', e.target.value)}
                        placeholder="#dc2626"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description Line 1
                    </label>
                    <input
                      type="text"
                      value={settings.rightSection.description1}
                      onChange={(e) => handleChange('rightSection', 'description1', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description Line 1 Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.rightSection.description1Color}
                        onChange={(e) => handleChange('rightSection', 'description1Color', e.target.value)}
                        className="w-20 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.rightSection.description1Color}
                        onChange={(e) => handleChange('rightSection', 'description1Color', e.target.value)}
                        placeholder="#2563eb"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description Line 2
                    </label>
                    <input
                      type="text"
                      value={settings.rightSection.description2}
                      onChange={(e) => handleChange('rightSection', 'description2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description Line 2 Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.rightSection.description2Color}
                        onChange={(e) => handleChange('rightSection', 'description2Color', e.target.value)}
                        className="w-20 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.rightSection.description2Color}
                        onChange={(e) => handleChange('rightSection', 'description2Color', e.target.value)}
                        placeholder="#111827"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={settings.rightSection.buttonText}
                      onChange={(e) => handleChange('rightSection', 'buttonText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Color
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings.rightSection.buttonColor}
                        onChange={(e) => handleChange('rightSection', 'buttonColor', e.target.value)}
                        className="w-20 h-10 rounded border border-gray-300"
                      />
                      <input
                        type="text"
                        value={settings.rightSection.buttonColor}
                        onChange={(e) => handleChange('rightSection', 'buttonColor', e.target.value)}
                        placeholder="#f59e0b"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={settings.rightSection.buttonLink}
                      onChange={(e) => handleChange('rightSection', 'buttonLink', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={saveSettings}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div style={{ backgroundColor: settings.backgroundColor }} className="p-6 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">Preview Background Color</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold mb-2">Left Section</h5>
                    <p className="text-sm"><strong>Title:</strong> {settings.leftSection.title}</p>
                    <p className="text-sm"><strong>Price:</strong> {settings.leftSection.price}</p>
                    <p className="text-sm"><strong>Button:</strong> {settings.leftSection.buttonText}</p>
                  </div>
                  <div>
                    <h5 className="font-semibold mb-2">Right Section</h5>
                    <p className="text-sm"><strong>Branding:</strong> {settings.rightSection.branding}</p>
                    <p className="text-sm"><strong>Title:</strong> {settings.rightSection.title}</p>
                    <p className="text-sm"><strong>Button:</strong> {settings.rightSection.buttonText}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
