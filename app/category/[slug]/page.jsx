'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { useSelector } from 'react-redux'
import ProductCard from '@/components/ProductCard'
import { FilterIcon, XIcon } from 'lucide-react'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1">
          <li>
            <Link href="/" className="hover:text-gray-900">Home</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium" aria-current="page">{categoryTitle || 'Category'}</li>
        </ol>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-gray-900">{categoryTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 border px-4 py-2 rounded hover:bg-gray-50 transition ${
            showFilters ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-300'
          }`}
        >
          <FilterIcon size={18} />
          Filter
        </button>

        {/* Price Filter Chip */}
        {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
          <button
            onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 100000] }))}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            <span>₹{filters.priceRange[0].toLocaleString('en-IN')} - ₹{filters.priceRange[1].toLocaleString('en-IN')}</span>
            <XIcon size={14} />
          </button>
        )}

        {/* Sort Dropdown */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
          >
            <option value="newest">Best Matches</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Price Range Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Price Range
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange[0]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]]
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange[1]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], parseInt(e.target.value) || 100000]
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                {[
                  { label: 'Under ₹5,000', value: [0, 5000] },
                  { label: '₹5,000 - ₹10,000', value: [5000, 10000] },
                  { label: '₹10,000 - ₹25,000', value: [10000, 25000] },
                  { label: 'Over ₹25,000', value: [25000, 100000] },
                ].map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setFilters(prev => ({ ...prev, priceRange: range.value }))}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 transition"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => setFilters({ priceRange: [0, 100000], categories: [] })}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
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
  )
}
