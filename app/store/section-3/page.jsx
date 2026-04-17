'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PageTitle from '@/components/PageTitle'

export default function Section3Settings() {
  const [shopCategoriesHeading, setShopCategoriesHeading] = useState({
    title: '',
    subtitle: ''
  })
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedShopCategories, setSelectedShopCategories] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [editingShopHeading, setEditingShopHeading] = useState(false)
  const [selectingShopCategories, setSelectingShopCategories] = useState(false)
  const [selectingProducts, setSelectingProducts] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch each API separately to identify which one fails
      let categoriesRes, productsRes, settingsRes;

      try {
        categoriesRes = await axios.get('/api/store/categories');
      } catch (err) {
        console.error('❌ categories error:', err.response?.status, err.message);
        categoriesRes = { data: { categories: [] } };
      }

      try {
        productsRes = await axios.get('/api/products');
      } catch (err) {
        console.error('❌ products error:', err.response?.status, err.message);
        productsRes = { data: { products: [] } };
      }

      try {
        settingsRes = await axios.get('/api/store/settings');
      } catch (err) {
        console.error('❌ settings error:', err.response?.status, err.message);
        settingsRes = { data: { settings: {} } };
      }

      // Load shop categories heading from settings
      if (settingsRes.data.settings?.shopCategoriesHeading) {
        setShopCategoriesHeading(settingsRes.data.settings.shopCategoriesHeading)
      }

      // Load categories (only parent categories, no subcategories)
      if (categoriesRes.data.categories) {
        const parentCategories = categoriesRes.data.categories.filter(cat => !cat.parentId)
        setCategories(parentCategories || [])
      }

      // Load products
      if (productsRes.data.products) {
        setProducts(productsRes.data.products || [])
      }

      // Load selected shop categories
      const shopDisplaySettings = settingsRes.data.settings?.shopCategoriesDisplay
      if (shopDisplaySettings?.selectedIds) {
        setSelectedShopCategories(shopDisplaySettings.selectedIds)
      }

      // Load selected products
      const displaySettings = settingsRes.data.settings?.section3Display
      if (displaySettings?.selectedProductIds) {
        setSelectedProducts(displaySettings.selectedProductIds)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const handleSaveShopHeading = async () => {
    setLoading(true)
    try {
      const { data } = await axios.put('/api/store/settings', {
        shopCategoriesHeading: shopCategoriesHeading
      })
      
      if (data.success) {
        toast.success('Shop Categories heading updated!')
        setEditingShopHeading(false)
      }
    } catch (error) {
      console.error('Error saving shop heading:', error)
      toast.error('Failed to save heading')
    } finally {
      setLoading(false)
    }
  }

  const toggleShopCategorySelection = (categoryId) => {
    setSelectedShopCategories(prev => {
      const updated = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
      
      // Keep max 7 selected
      return updated.slice(0, 7)
    })
  }

  const saveShopCategorySelection = async () => {
    setLoading(true)
    try {
      await axios.put('/api/store/settings', {
        shopCategoriesDisplay: {
          selectedIds: selectedShopCategories,
          order: selectedShopCategories
        }
      })
      toast.success('Shop categories selection updated')
      setSelectingShopCategories(false)
      fetchData()
    } catch (error) {
      console.error('Error saving shop categories:', error)
      toast.error('Failed to save selection')
    } finally {
      setLoading(false)
    }
  }

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      const updated = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
      
      // Keep max 10 selected
      return updated.slice(0, 10)
    })
  }

  const saveProductSelection = async () => {
    setLoading(true)
    try {
      await axios.put('/api/store/settings', {
        section3Display: {
          selectedCategoryIds: selectedShopCategories,
          selectedProductIds: selectedProducts,
          order: selectedProducts
        }
      })
      toast.success('Product selection updated')
      setSelectingProducts(false)
      fetchData()
    } catch (error) {
      console.error('Error saving products:', error)
      toast.error('Failed to save product selection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <PageTitle title="Shop Categories Management" />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Image Upload Guidelines </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>Recommended image size: 1200 x 1200 px (1:1 ratio)</p>
            <p>Supported formats: JPG, PNG, WEBP</p>
            <p>Recommended max file size: 5 MB per image</p>
            <p className="text-blue-700">Tip: Upload clear square images for best display on homepage cards.</p>
          </div>
        </div>

        {/* Shop Categories Heading Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Shop Categories Heading</h3>
            {!editingShopHeading && (
              <button
                onClick={() => setEditingShopHeading(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editingShopHeading ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={shopCategoriesHeading.title}
                  onChange={(e) => setShopCategoriesHeading(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={shopCategoriesHeading.subtitle}
                  onChange={(e) => setShopCategoriesHeading(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveShopHeading}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingShopHeading(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-xl font-serif text-gray-900 mb-1">
                {shopCategoriesHeading.title || 'Find Your Perfect Match'}
              </h4>
              <p className="text-gray-600">
                {shopCategoriesHeading.subtitle || 'Shop by Categories'}
              </p>
            </div>
          )}
        </div>

        {/* Shop Categories Display Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Shop Categories Display (Max 7)</h3>
            {!selectingShopCategories && (
              <button
                onClick={() => setSelectingShopCategories(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit Selection
              </button>
            )}
          </div>

          {selectingShopCategories ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select up to 7 categories to display on homepage. Click to toggle selection.</p>
              {categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      onClick={() => toggleShopCategorySelection(category._id.toString())}
                      className={`p-4 rounded-lg cursor-pointer border-2 transition ${
                        selectedShopCategories.includes(category._id.toString())
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedShopCategories.includes(category._id.toString())}
                          onChange={() => {}}
                          className="w-4 h-4 rounded mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-gray-500 truncate">{category.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-2">No categories available</p>
                  <p className="text-sm text-gray-400">Create categories first in the Categories page</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={saveShopCategorySelection}
                  disabled={loading || selectedShopCategories.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Selection'}
                </button>
                <button
                  onClick={() => setSelectingShopCategories(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {selectedShopCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories
                    .filter(cat => selectedShopCategories.includes(cat._id.toString()))
                    .map((category) => (
                      <div key={category._id} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        {category.image && (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                        )}
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        {category.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No categories selected. Click "Edit Selection" to choose.</p>
              )}
            </div>
          )}
        </div>

        {/* Product Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Display Products (Max 10)</h3>
            {!selectingProducts && (
              <button
                onClick={() => setSelectingProducts(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit Selection
              </button>
            )}
          </div>

          {selectingProducts ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Select up to 10 products to display. Click to toggle selection.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => toggleProductSelection(product._id.toString())}
                    className={`p-4 rounded-lg cursor-pointer border-2 transition ${
                      selectedProducts.includes(product._id.toString())
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id.toString())}
                        onChange={() => {}}
                        className="w-4 h-4 rounded mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                        <p className="text-sm text-gray-500">AED{product.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={saveProductSelection}
                  disabled={loading || selectedProducts.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Selection'}
                </button>
                <button
                  onClick={() => setSelectingProducts(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {selectedProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {products
                    .filter(prod => selectedProducts.includes(prod._id.toString()))
                    .map((product) => (
                      <div key={product._id} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        {product.images && product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                        )}
                        <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                        <p className="text-sm text-gray-500">AED{product.price}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No products selected. Click "Edit Selection" to choose.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
