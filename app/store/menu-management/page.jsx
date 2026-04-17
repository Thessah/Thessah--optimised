'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PageTitle from '@/components/PageTitle'

export default function MenuManagement() {
  const [activeTab, setActiveTab] = useState('navbar') // 'navbar' or 'footer'
  const [isFetching, setIsFetching] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  const [navMenuItems, setNavMenuItems] = useState([])
  const [hasNavChanges, setHasNavChanges] = useState(false)

  const [footerSections, setFooterSections] = useState([])
  const [hasFooterChanges, setHasFooterChanges] = useState(false)

  const [categories, setCategories] = useState([])

  const [editingNavIndex, setEditingNavIndex] = useState(null)
  const [editingFooterSection, setEditingFooterSection] = useState(null)
  const [editingFooterLinkIndex, setEditingFooterLinkIndex] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadingNavIconIndex, setUploadingNavIconIndex] = useState(null)

  useEffect(() => {
    fetchData()

    // Only auto-fetch if there are no unsaved changes
    const interval = setInterval(() => {
      if (!hasNavChanges && !hasFooterChanges) {
        fetchData()
      }
    }, 30000) // keep admin view in sync
    return () => clearInterval(interval)
  }, [hasNavChanges, hasFooterChanges])

  const fetchData = async () => {
    try {
      setIsFetching(true)
      const [settingsRes, categoriesRes] = await Promise.all([
        axios.get('/api/store/settings'),
        axios.get('/api/store/categories')
      ])
      
      if (settingsRes.data.settings?.navMenuItems) {
        setNavMenuItems(settingsRes.data.settings.navMenuItems)
      }

      if (settingsRes.data.settings?.footerSections) {
        setFooterSections(settingsRes.data.settings.footerSections)
      }

      if (categoriesRes.data?.categories) {
        setCategories(categoriesRes.data.categories)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Unable to load latest menu settings')
    } finally {
      setIsFetching(false)
      setInitialLoading(false)
    }
  }

  const handleNavItemChange = (index, field, value) => {
    const updated = [...navMenuItems]
    updated[index] = { ...updated[index], [field]: value }
    setNavMenuItems(updated)
    setHasNavChanges(true)
  }

  const handleFooterLinkChange = (sectionIndex, linkIndex, field, value) => {
    const updated = [...footerSections]
    updated[sectionIndex].links[linkIndex] = {
      ...updated[sectionIndex].links[linkIndex],
      [field]: value
    }
    setFooterSections(updated)
    setHasFooterChanges(true)
  }

  const handleFooterSectionTitleChange = (sectionIndex, value) => {
    const updated = [...footerSections]
    updated[sectionIndex].title = value
    setFooterSections(updated)
    setHasFooterChanges(true)
  }

  const addNavMenuItem = () => {
    setNavMenuItems([...navMenuItems, { name: 'New Item', link: '#', hasDropdown: false, icon: '' }])
    setHasNavChanges(true)
    toast.success('New menu item added')
  }

  const handleNavIconUpload = async (index, file) => {
    if (!file) return

    setUploadingNavIconIndex(index)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/store/upload-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data?.url) {
        const updated = [...navMenuItems]
        updated[index] = { ...updated[index], icon: response.data.url }
        setNavMenuItems(updated)

        // Persist immediately so icon appears on frontend without extra manual save step.
        const saveRes = await axios.put('/api/store/settings', {
          navMenuItems: updated
        })

        if (saveRes.data?.settings?.navMenuItems) {
          setNavMenuItems(saveRes.data.settings.navMenuItems)
        }

        setHasNavChanges(false)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('navMenuUpdated'))
        }
        toast.success('Menu icon uploaded and saved')
      } else {
        toast.error('Upload failed: no URL returned')
      }
    } catch (error) {
      console.error('Nav icon upload error:', error)
      toast.error('Failed to upload menu icon')
    } finally {
      setUploadingNavIconIndex(null)
    }
  }

  const deleteNavMenuItem = (index) => {
    const updated = navMenuItems.filter((_, i) => i !== index)
    setNavMenuItems(updated)
    setHasNavChanges(true)
    toast.success('Menu item deleted')
  }

  const addFooterLink = (sectionIndex) => {
    const updated = [...footerSections]
    updated[sectionIndex].links.push({ name: 'New Link', link: '#', isPhone: false, isChat: false })
    setFooterSections(updated)
    setHasFooterChanges(true)
    toast.success('New footer link added')
  }

  const deleteFooterLink = (sectionIndex, linkIndex) => {
    const updated = [...footerSections]
    updated[sectionIndex].links = updated[sectionIndex].links.filter((_, i) => i !== linkIndex)
    setFooterSections(updated)
    setHasFooterChanges(true)
    toast.success('Footer link deleted')
  }

  const addFooterSection = () => {
    const newSection = {
      title: 'New Section',
      links: [{ name: 'New Link', link: '#', isPhone: false, isChat: false }]
    }
    setFooterSections([...(footerSections || []), newSection])
    setHasFooterChanges(true)
    toast.success('Footer section added')
  }

  const deleteFooterSection = (sectionIndex) => {
    const updated = (footerSections || []).filter((_, i) => i !== sectionIndex)
    setFooterSections(updated)
    setHasFooterChanges(true)
    toast.success('Footer section deleted')
  }

  const handleNavCategorySelect = (index, categoryId) => {
    const cat = categories.find((c) => c._id === categoryId)
    if (!cat) return
    const updated = [...navMenuItems]
    const linkUrl = `/category/${cat.slug || cat._id}`
    updated[index] = {
      ...updated[index],
      link: linkUrl,
      name: updated[index].name || cat.name,
      categoryId
    }
    setNavMenuItems(updated)
    setHasNavChanges(true)
    toast.success('Category link set')
  }

  const handleFooterLinkCategorySelect = (sectionIndex, linkIndex, categoryId) => {
    const cat = categories.find((c) => c._id === categoryId)
    if (!cat) return
    const linkUrl = `/category/${cat.slug || cat._id}`
    const updated = [...footerSections]
    const currentLink = updated[sectionIndex].links[linkIndex]
    updated[sectionIndex].links[linkIndex] = {
      ...currentLink,
      link: linkUrl,
      name: currentLink.name || cat.name,
      categoryId
    }
    setFooterSections(updated)
    setHasFooterChanges(true)
    toast.success('Category link applied')
  }

  const saveNavMenu = async () => {
    setLoading(true)
    try {
      const response = await axios.put('/api/store/settings', {
        navMenuItems: navMenuItems
      })
      toast.success('Navigation menu updated')
      setEditingNavIndex(null)
      setHasNavChanges(false)
      // Update local state with returned data instead of refetching
      if (response.data.settings?.navMenuItems) {
        setNavMenuItems(response.data.settings.navMenuItems)
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('navMenuUpdated'))
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to update menu')
    } finally {
      setLoading(false)
    }
  }

  const saveFooterMenu = async () => {
    setLoading(true)
    try {
      const response = await axios.put('/api/store/settings', {
        footerSections: footerSections
      })
      toast.success('Footer menu updated')
      setEditingFooterSection(null)
      setEditingFooterLinkIndex(null)
      setHasFooterChanges(false)
      // Update local state with returned data instead of refetching
      if (response.data.settings?.footerSections) {
        setFooterSections(response.data.settings.footerSections)
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to update footer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <PageTitle title="Menu Management" />

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('navbar')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
              activeTab === 'navbar'
                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📱 Navigation Bar Menu
          </button>
          <button
            onClick={() => setActiveTab('footer')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
              activeTab === 'footer'
                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📄 Footer Menu
          </button>
          <div className="px-4 py-3 flex items-center gap-3">
            {isFetching && <span className="text-sm text-gray-500">Syncing…</span>}
            <button
              onClick={fetchData}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-200"
            >
              Refresh now
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Menu Section */}
      {activeTab === 'navbar' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {initialLoading ? (
            <p className="text-sm text-gray-500">Loading menu…</p>
          ) : (
            <>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Navigation Bar Menu</h3>
            <p className="text-sm text-gray-600">
              Manage the top navigation menu items (All Jewellery, Gold, Diamond, etc.)
            </p>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={addNavMenuItem}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add Menu Item
            </button>
          </div>

        <div className="space-y-3">
          {navMenuItems.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Menu Text
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleNavItemChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Link URL
                      </label>
                      <input
                        type="text"
                        value={item.link}
                        onChange={(e) => handleNavItemChange(index, 'link', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Icon URL (optional)
                      </label>
                      <input
                        type="text"
                        value={item.icon || ''}
                        onChange={(e) => handleNavItemChange(index, 'icon', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Icon
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleNavIconUpload(index, e.target.files?.[0])}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      {uploadingNavIconIndex === index && (
                        <p className="text-xs text-blue-600 mt-1">Uploading icon...</p>
                      )}
                    </div>
                  </div>
                  {item.icon && (
                    <div className="pt-1">
                      <p className="text-xs text-gray-500 mb-1">Icon preview:</p>
                      <img
                        src={item.icon}
                        alt={`${item.name || 'menu'} icon`}
                        className="w-8 h-8 object-contain border border-gray-200 rounded"
                      />
                    </div>
                  )}
                  {categories.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Set from Category
                        </label>
                        <select
                          value={item.categoryId || ''}
                          onChange={(e) => handleNavCategorySelect(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Select category --</option>
                          {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Selecting sets the link to that category.</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.hasDropdown}
                      onChange={(e) => handleNavItemChange(index, 'hasDropdown', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label className="text-sm text-gray-700">Has Dropdown Menu</label>
                  </div>
                </div>
                <button
                  onClick={() => deleteNavMenuItem(index)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={saveNavMenu}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Navigation Menu'}
          </button>
        </div>
            </>
          )}
      </div>
      )}

      {/* Footer Menu Section */}
      {activeTab === 'footer' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {initialLoading ? (
            <p className="text-sm text-gray-500">Loading menu…</p>
          ) : (
            <>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Footer Menu</h3>
            <p className="text-sm text-gray-600">
              Manage footer sections (Useful Links, Information, Contact Us) and their links
            </p>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={addFooterSection}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add Section
            </button>
          </div>

          <div className="space-y-6">
            {footerSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleFooterSectionTitleChange(sectionIndex, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => deleteFooterSection(sectionIndex)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete Section
                  </button>
                </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-800">Links</h4>
                  <button
                    onClick={() => addFooterLink(sectionIndex)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    + Add Link
                  </button>
                </div>

                {section.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="flex gap-3 items-start bg-gray-50 p-3 rounded">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Link Text
                          </label>
                          <input
                            type="text"
                            value={link.name}
                            onChange={(e) => handleFooterLinkChange(sectionIndex, linkIndex, 'name', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Link URL
                          </label>
                          <input
                            type="text"
                            value={link.link}
                            onChange={(e) => handleFooterLinkChange(sectionIndex, linkIndex, 'link', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {categories.length > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Set from Category
                            </label>
                            <select
                              value={link.categoryId || ''}
                              onChange={(e) => handleFooterLinkCategorySelect(sectionIndex, linkIndex, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">-- Select category --</option>
                              {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Selecting sets the link to that category.</p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={link.isPhone || false}
                            onChange={(e) => handleFooterLinkChange(sectionIndex, linkIndex, 'isPhone', e.target.checked)}
                            className="w-3 h-3"
                          />
                          <label className="text-xs text-gray-700">Phone Number</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={link.isChat || false}
                            onChange={(e) => handleFooterLinkChange(sectionIndex, linkIndex, 'isChat', e.target.checked)}
                            className="w-3 h-3"
                          />
                          <label className="text-xs text-gray-700">Chat Link</label>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteFooterLink(sectionIndex, linkIndex)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={saveFooterMenu}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Footer Menu'}
          </button>
        </div>
            </>
          )}
      </div>
      )}
    </div>
  )
}
