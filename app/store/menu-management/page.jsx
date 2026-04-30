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
  const [navMenuEnabled, setNavMenuEnabled] = useState(true)
  const [navActionsVisibility, setNavActionsVisibility] = useState({
    store: true,
    wishlist: true,
    cart: true
  })
  const [hasNavChanges, setHasNavChanges] = useState(false)

  const [footerSections, setFooterSections] = useState([])
  const [hasFooterChanges, setHasFooterChanges] = useState(false)

  const [topBar, setTopBar] = useState({
    enabled: true,
    text: '',
    buttonText: 'Apply Now',
    buttonPath: '/'
  })
  const [hasTopBarChanges, setHasTopBarChanges] = useState(false)

  const [categories, setCategories] = useState([])

  const [editingNavIndex, setEditingNavIndex] = useState(null)
  const [editingFooterSection, setEditingFooterSection] = useState(null)
  const [editingFooterLinkIndex, setEditingFooterLinkIndex] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadingNavIconIndex, setUploadingNavIconIndex] = useState(null)
  const [uploadingMegaImageIndex, setUploadingMegaImageIndex] = useState(null) // `${itemIdx}-${imgIdx}`

  useEffect(() => {
    fetchData()

    // Only auto-fetch if there are no unsaved changes
    const interval = setInterval(() => {
      if (!hasNavChanges && !hasFooterChanges && !hasTopBarChanges) {
        fetchData()
      }
    }, 30000) // keep admin view in sync
    return () => clearInterval(interval)
}, [hasNavChanges, hasFooterChanges, hasTopBarChanges])

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

      if (typeof settingsRes.data.settings?.navMenuEnabled === 'boolean') {
        setNavMenuEnabled(settingsRes.data.settings.navMenuEnabled)
      } else {
        setNavMenuEnabled(true)
      }

      const actionsVisibility = settingsRes.data.settings?.navActionsVisibility
      if (actionsVisibility && typeof actionsVisibility === 'object') {
        setNavActionsVisibility({
          store: actionsVisibility.store !== false,
          wishlist: actionsVisibility.wishlist !== false,
          cart: actionsVisibility.cart !== false
        })
      } else {
        setNavActionsVisibility({ store: true, wishlist: true, cart: true })
      }

      if (settingsRes.data.settings?.footerSections) {
        setFooterSections(settingsRes.data.settings.footerSections)
      }

      if (settingsRes.data.settings?.topBar) {
        setTopBar(settingsRes.data.settings.topBar)
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
          navMenuItems: updated,
          navMenuEnabled,
          navActionsVisibility
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

  // ── Mega-menu helpers ───────────────────────────────────────────
  const getMegaMenu = (item) => item.megaMenu || { links: [], images: [] }

  const handleMegaLinkChange = (itemIdx, linkIdx, field, value) => {
    const updated = [...navMenuItems]
    const mm = { ...getMegaMenu(updated[itemIdx]) }
    mm.links = [...(mm.links || [])]
    mm.links[linkIdx] = { ...mm.links[linkIdx], [field]: value }
    updated[itemIdx] = { ...updated[itemIdx], megaMenu: mm }
    setNavMenuItems(updated)
    setHasNavChanges(true)
  }

  const addMegaLink = (itemIdx) => {
    const updated = [...navMenuItems]
    const mm = { ...getMegaMenu(updated[itemIdx]) }
    mm.links = [...(mm.links || []), { name: '', link: '' }]
    updated[itemIdx] = { ...updated[itemIdx], megaMenu: mm }
    setNavMenuItems(updated)
    setHasNavChanges(true)
  }

  const removeMegaLink = (itemIdx, linkIdx) => {
    const updated = [...navMenuItems]
    const mm = { ...getMegaMenu(updated[itemIdx]) }
    mm.links = (mm.links || []).filter((_, i) => i !== linkIdx)
    updated[itemIdx] = { ...updated[itemIdx], megaMenu: mm }
    setNavMenuItems(updated)
    setHasNavChanges(true)
  }

  const handleMegaImageChange = (itemIdx, imgIdx, field, value) => {
    const updated = [...navMenuItems]
    const mm = { ...getMegaMenu(updated[itemIdx]) }
    mm.images = [...(mm.images || [])]
    mm.images[imgIdx] = { ...(mm.images[imgIdx] || {}), [field]: value }
    updated[itemIdx] = { ...updated[itemIdx], megaMenu: mm }
    setNavMenuItems(updated)
    setHasNavChanges(true)
  }

  const handleMegaImageUpload = async (itemIdx, imgIdx, file) => {
    if (!file) return
    const key = `${itemIdx}-${imgIdx}`
    setUploadingMegaImageIndex(key)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post('/api/store/upload-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data?.url) {
        handleMegaImageChange(itemIdx, imgIdx, 'url', res.data.url)
        toast.success('Image uploaded')
      } else {
        toast.error('Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploadingMegaImageIndex(null)
    }
  }

  const handleMegaLinkCategorySelect = (itemIdx, linkIdx, categoryId) => {
    const cat = categories.find((c) => c._id === categoryId)
    if (!cat) return
    const linkUrl = `/category/${cat.slug || cat._id}`
    handleMegaLinkChange(itemIdx, linkIdx, 'link', linkUrl)
    if (!navMenuItems[itemIdx]?.megaMenu?.links?.[linkIdx]?.name) {
      handleMegaLinkChange(itemIdx, linkIdx, 'name', cat.name)
    }
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
        navMenuItems: navMenuItems,
        navMenuEnabled,
        navActionsVisibility
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

  const saveTopBar = async () => {
    setLoading(true)
    try {
      const response = await axios.put('/api/store/settings', { topBar })
      toast.success('Top bar updated')
      setHasTopBarChanges(false)
      if (response.data.settings?.topBar) {
        setTopBar(response.data.settings.topBar)
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to update top bar')
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
          <button
            onClick={() => setActiveTab('topbar')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
              activeTab === 'topbar'
                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📢 Top Bar
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

          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Enable Top Navigation Bar</p>
                <p className="text-xs text-gray-600">Show or hide the desktop category bar on the storefront navbar.</p>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={navMenuEnabled}
                  onChange={(e) => {
                    setNavMenuEnabled(e.target.checked)
                    setHasNavChanges(true)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  {navMenuEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">Navbar Action Icons</p>
            <p className="text-xs text-gray-600 mb-3">Enable or disable Store, Wishlist, and Cart icons on the top-right navbar.</p>
            <div className="flex flex-wrap gap-5">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={navActionsVisibility.store}
                  onChange={(e) => {
                    setNavActionsVisibility((prev) => ({ ...prev, store: e.target.checked }))
                    setHasNavChanges(true)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Store</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={navActionsVisibility.wishlist}
                  onChange={(e) => {
                    setNavActionsVisibility((prev) => ({ ...prev, wishlist: e.target.checked }))
                    setHasNavChanges(true)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Wishlist</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={navActionsVisibility.cart}
                  onChange={(e) => {
                    setNavActionsVisibility((prev) => ({ ...prev, cart: e.target.checked }))
                    setHasNavChanges(true)
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Cart</span>
              </label>
            </div>
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
                    <label className="text-sm text-gray-700">Has Mega Dropdown</label>
                  </div>

                  {/* ── Mega-menu editor ─────────────────────────────── */}
                  {item.hasDropdown && (
                    <div className="mt-3 border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
                      <p className="text-sm font-semibold text-blue-800">Mega Dropdown Configuration</p>

                      {/* Dropdown links */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-700">Dropdown Links</p>
                          <button
                            type="button"
                            onClick={() => addMegaLink(index)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >+ Add Link</button>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <p className="text-xs text-gray-600 shrink-0">Link columns:</p>
                          {[1, 2, 3].map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => {
                                const updated = [...navMenuItems]
                                const mm = { ...getMegaMenu(updated[index]) }
                                mm.linkColumns = col
                                updated[index] = { ...updated[index], megaMenu: mm }
                                setNavMenuItems(updated)
                                setHasNavChanges(true)
                              }}
                              className={`px-3 py-1 text-xs rounded border font-medium transition ${
                                (getMegaMenu(item).linkColumns || 1) === col
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                              }`}
                            >{col} col{col > 1 ? 's' : ''}</button>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {(getMegaMenu(item).links || []).map((lnk, li) => (
                            <div key={li} className="flex gap-2 items-center bg-white rounded border border-gray-200 p-2">
                              <input
                                type="text"
                                placeholder="Label"
                                value={lnk.name || ''}
                                onChange={(e) => handleMegaLinkChange(index, li, 'name', e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                              <input
                                type="text"
                                placeholder="URL  e.g. /category/gold"
                                value={lnk.link || ''}
                                onChange={(e) => handleMegaLinkChange(index, li, 'link', e.target.value)}
                                className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                              {categories.length > 0 && (
                                <select
                                  defaultValue=""
                                  onChange={(e) => handleMegaLinkCategorySelect(index, li, e.target.value)}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                                >
                                  <option value="">From category…</option>
                                  {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                  ))}
                                </select>
                              )}
                              <button
                                type="button"
                                onClick={() => removeMegaLink(index, li)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 shrink-0"
                              >✕</button>
                            </div>
                          ))}
                          {(getMegaMenu(item).links || []).length === 0 && (
                            <p className="text-xs text-gray-400 italic">No links yet. Click "+ Add Link".</p>
                          )}
                        </div>
                      </div>

                      {/* Featured images (up to 3) */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Featured Images (up to 3)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[0, 1, 2].map((imgIdx) => {
                            const img = getMegaMenu(item).images?.[imgIdx] || {}
                            const uploading = uploadingMegaImageIndex === `${index}-${imgIdx}`
                            return (
                              <div key={imgIdx} className="bg-white border border-gray-200 rounded-lg p-2 space-y-2">
                                <p className="text-xs font-medium text-gray-500">Image {imgIdx + 1}</p>
                                {img.url && (
                                  <img src={img.url} alt="" className="w-full h-24 object-cover rounded" />
                                )}
                                <label className="block w-full cursor-pointer">
                                  <span className="block w-full text-center text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-dashed border-gray-300">
                                    {uploading ? 'Uploading…' : img.url ? 'Replace image' : 'Upload image'}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleMegaImageUpload(index, imgIdx, e.target.files?.[0])}
                                  />
                                </label>
                                <input
                                  type="text"
                                  placeholder="Label (e.g. Gold Rings)"
                                  value={img.label || ''}
                                  onChange={(e) => handleMegaImageChange(index, imgIdx, 'label', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                                <input
                                  type="text"
                                  placeholder="Link URL"
                                  value={img.link || ''}
                                  onChange={(e) => handleMegaImageChange(index, imgIdx, 'link', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                                {categories.length > 0 && (
                                  <select
                                    defaultValue=""
                                    onChange={(e) => {
                                      const cat = categories.find(c => c._id === e.target.value)
                                      if (!cat) return
                                      handleMegaImageChange(index, imgIdx, 'link', `/category/${cat.slug || cat._id}`)
                                      if (!img.label) handleMegaImageChange(index, imgIdx, 'label', cat.name)
                                    }}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                  >
                                    <option value="">Set link from category…</option>
                                    {categories.map((cat) => (
                                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
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
      {activeTab === 'topbar' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {initialLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Top Announcement Bar</h3>
                <p className="text-sm text-gray-600">The slim banner shown above the navbar. Edit the message, button label and the page it links to.</p>
              </div>

              <div className="space-y-5">
                {/* Enable toggle */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Show Top Bar</p>
                    <p className="text-xs text-gray-500">Toggle visibility on the storefront</p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={topBar.enabled}
                      onChange={(e) => { setTopBar(p => ({ ...p, enabled: e.target.checked })); setHasTopBarChanges(true) }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">{topBar.enabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>

                {/* Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bar Text / Message</label>
                  <input
                    type="text"
                    value={topBar.text}
                    onChange={(e) => { setTopBar(p => ({ ...p, text: e.target.value })); setHasTopBarChanges(true) }}
                    placeholder="e.g. Exclusive Offer: AED 199 OFF your first order!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Button text */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Label</label>
                    <input
                      type="text"
                      value={topBar.buttonText}
                      onChange={(e) => { setTopBar(p => ({ ...p, buttonText: e.target.value })); setHasTopBarChanges(true) }}
                      placeholder="Apply Now"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Path / URL</label>
                    <input
                      type="text"
                      value={topBar.buttonPath}
                      onChange={(e) => { setTopBar(p => ({ ...p, buttonPath: e.target.value })); setHasTopBarChanges(true) }}
                      placeholder="/collection/sale"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Preview</p>
                  <div className="flex items-center justify-center gap-3 py-3 px-4 bg-white border border-yellow-300 rounded-xl shadow text-sm">
                    <span className="text-yellow-500 text-lg">💎</span>
                    <span className="text-yellow-800 font-semibold flex-1 text-center">{topBar.text || 'Your message will appear here…'}</span>
                    {topBar.buttonText && (
                      <span className="bg-yellow-400 text-white font-bold py-1 px-4 rounded-full text-xs">{topBar.buttonText}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={saveTopBar}
                  disabled={loading || !hasTopBarChanges}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Top Bar'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
