'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { useSelector } from 'react-redux'
import ProductCard from '@/components/ProductCard'
import { FilterIcon, XIcon, ChevronDownIcon } from 'lucide-react'

const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const matchesCategorySlug = (product, normalizedSlug) => {
  const categorySlug = slugify(product?.category)
  const altSlug = slugify(product?.categorySlug)
  const categoryName = (product?.category || '').toString().trim().toLowerCase()

  return (
    categorySlug === normalizedSlug ||
    altSlug === normalizedSlug ||
    categoryName === normalizedSlug.replace(/-/g, ' ')
  )
}

export default function CategoryPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || ''
  const normalizedSlug = decodeURIComponent(slug).toLowerCase()
  const products = useSelector((state) => state.product.list || [])
  const [categoryTitle, setCategoryTitle] = useState('')
  const [fetchedProducts, setFetchedProducts] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ priceRange: [0, 100000], categories: [] })
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)

  const reduxMatchedProducts = useMemo(
    () => products.filter((product) => matchesCategorySlug(product, normalizedSlug)),
    [products, normalizedSlug]
  )

  const fallbackCategoryTitle = useMemo(() => {
    if (reduxMatchedProducts[0]?.category) return reduxMatchedProducts[0].category

    return normalizedSlug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Category'
  }, [reduxMatchedProducts, normalizedSlug])

  useEffect(() => {
    const fetchCategoryNameAndProducts = async () => {
      const hasReduxFallback = reduxMatchedProducts.length > 0

      try {
        setLoading(!hasReduxFallback)
        const [categoryRes, productRes] = await Promise.all([
          axios.get('/api/store/categories?lite=true'),
          axios.get(`/api/products?category=${encodeURIComponent(fallbackCategoryTitle)}&compact=true`),
        ])

        // Resolve category name from store categories
        const res = categoryRes
        const cats = Array.isArray(res.data?.categories) ? res.data.categories : []
        const match = cats.find((c) =>
          (c.slug && c.slug.toLowerCase() === normalizedSlug) ||
          slugify(c.name) === normalizedSlug
        )

        const resolvedTitle = match?.name || fallbackCategoryTitle

        if (match?.name) {
          setCategoryTitle(match.name)
        } else {
          setCategoryTitle(fallbackCategoryTitle)
        }

        if (!match?.name && resolvedTitle !== fallbackCategoryTitle) {
          const refinedRes = await axios.get(`/api/products?category=${encodeURIComponent(resolvedTitle)}&compact=true`)
          setFetchedProducts(Array.isArray(refinedRes.data?.products) ? refinedRes.data.products : [])
        } else {
          setFetchedProducts(Array.isArray(productRes.data?.products) ? productRes.data.products : [])
        }
      } catch (e) {
        if (!hasReduxFallback) {
          setFetchedProducts([])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchCategoryNameAndProducts()
  }, [normalizedSlug, fallbackCategoryTitle, reduxMatchedProducts.length])

  // Prefer fetchedProducts if available, else fallback to Redux filtered
  const filteredProducts = useMemo(() => {
    let productsToFilter = [];
    
    if (Array.isArray(fetchedProducts)) {
      productsToFilter = fetchedProducts;
    } else if (reduxMatchedProducts.length > 0) {
      productsToFilter = [...reduxMatchedProducts];
    }
    
    // Apply filters
    if (filters.priceRange && filters.priceRange[0] > 0 || filters.priceRange && filters.priceRange[1] < 100000) {
      productsToFilter = productsToFilter.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        productsToFilter.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        productsToFilter.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        productsToFilter.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return productsToFilter;
  }, [products, normalizedSlug, fetchedProducts, filters, sortBy])

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-gray-900 transition font-medium">Home</Link>
            </li>
            <li className="text-gray-300">/</li>
            <li className="text-gray-900 font-semibold" aria-current="page">{categoryTitle || 'Category'}</li>
          </ol>
        </nav>

        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-serif text-gray-900 mb-2">{categoryTitle}</h1>
          <p className="text-lg text-gray-500 font-light">{filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'} available</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-gray-200">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2.5 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all font-medium text-gray-700 shadow-sm hover:shadow-md"
          >
            <FilterIcon size={18} />
            <span>Filter</span>
          </button>

        {/* Price Filter Chip */}
        {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
          <button
            onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 100000] }))}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm transition-colors font-medium"
          >
            <span>AED {filters.priceRange[0].toLocaleString()} - AED {filters.priceRange[1].toLocaleString()}</span>
            <XIcon size={14} className="text-gray-500" />
          </button>
        )}

        {/* Sort Dropdown - Modern Design */}
        <div className="ml-auto relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 shadow-sm"
          >
            <span className="text-gray-500">Sort By</span>
            <span className="text-gray-900 font-semibold min-w-[130px] text-left">
              {sortBy === 'newest' && 'Best Matches'}
              {sortBy === 'price-low' && 'Price: Low to High'}
              {sortBy === 'price-high' && 'Price: High to Low'}
            </span>
            <ChevronDownIcon size={16} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)}></div>
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-40 overflow-hidden p-1">
                {[
                  { value: 'newest', label: 'Best Matches' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value)
                      setShowSortMenu(false)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-medium ${
                      sortBy === option.value
                        ? 'bg-amber-50 text-amber-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowFilters(false)}></div>
          
          {/* Filter Modal - Simplified Tanishq Style */}
          <div className="fixed inset-y-0 left-0 w-full sm:w-80 bg-white z-50 overflow-y-auto shadow-lg">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Price Range Filter */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Price Range</h4>
                <div className="space-y-4">
                  {/* Input Fields */}
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.priceRange[0]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]]
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      placeholder="100000"
                      value={filters.priceRange[1]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceRange: [prev.priceRange[0], parseInt(e.target.value) || 100000]
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Preset Price Ranges */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Under AED 5,000', value: [0, 5000] },
                      { label: 'AED 5,000 - AED 10,000', value: [5000, 10000] },
                      { label: 'AED 10,000 - AED 25,000', value: [10000, 25000] },
                      { label: 'Over AED 25,000', value: [25000, 100000] },
                    ].map((range) => (
                      <button
                        key={range.label}
                        onClick={() => setFilters(prev => ({ ...prev, priceRange: range.value }))}
                        className={`px-3 py-2 text-xs rounded-full border transition ${
                          filters.priceRange[0] === range.value[0] && filters.priceRange[1] === range.value[1]
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>
            </div>

            {/* Action Buttons - Fixed at Bottom */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={() => setFilters({ priceRange: [0, 100000], categories: [] })}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">Loading…</div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          No products found in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
