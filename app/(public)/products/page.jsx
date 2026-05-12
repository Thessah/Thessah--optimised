'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchProducts } from '@/lib/features/product/productSlice'
import ProductCard from '@/components/ProductCard'
import { ChevronDownIcon, ChevronUpIcon, FilterIcon, XIcon, StarIcon, PlusIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function ProductsContent() {
    const dispatch = useDispatch();
    const products = useSelector(state => state.product.list)

    // Always fetch latest products on mount
    useEffect(() => {
        dispatch(fetchProducts({}))
    }, [dispatch])
    const searchParams = useSearchParams()
    const categoryParam = searchParams.get('category')

    const [showFilters, setShowFilters] = useState(false)
    const [showSortMenu, setShowSortMenu] = useState(false)
    const [showMoreCats, setShowMoreCats] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState({ price: true, categories: true, rating: true, stock: false })
    const [filters, setFilters] = useState({
        categories: categoryParam ? [categoryParam] : [],
        priceRange: [0, 100000],
        minRating: 0,
        inStock: false
    })
    const [sortBy, setSortBy] = useState('newest') // newest, price-low, price-high, rating
    const [searchQuery, setSearchQuery] = useState('')

    const toggleGroup = (group) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
    }

    // Get unique categories from products
    const categories = useMemo(() => {
        const cats = new Set()
        products.forEach(p => p.category && cats.add(p.category))
        return Array.from(cats).sort()
    }, [products])

    // Toggle category filter
    const toggleCategory = (category) => {
        setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }))
    }

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            categories: [],
            priceRange: [0, 100000],
            minRating: 0,
            inStock: false
        })
        setSortBy('newest')
    }

    const applyPriceRange = (min, max) => {
        setFilters(prev => ({ ...prev, priceRange: [min, max] }))
    }

    const applyCategory = (label) => {
        // Map friendly labels to actual category keys where needed
        const category = label === 'Gold Jewellery' ? 'Gold' : label
        toggleCategory(category)
    }

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = [...products]

        // Only include products with a slug
        filtered = filtered.filter(p => p.slug && typeof p.slug === 'string' && p.slug.length > 0)

        // Filter by category
        if (filters.categories.length > 0) {
            filtered = filtered.filter(p => filters.categories.includes(p.category))
        }

        // Filter by price range
        filtered = filtered.filter(p => 
            p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
        )

        // Filter by rating
        if (filters.minRating > 0) {
            filtered = filtered.filter(p => {
                const avgRating = p.rating?.length 
                    ? p.rating.reduce((acc, r) => acc + r.rating, 0) / p.rating.length 
                    : 0
                return avgRating >= filters.minRating
            })
        }

        // Filter by stock
        if (filters.inStock) {
            filtered = filtered.filter(p => p.inStock)
        }

        // Text search filter
        if (searchQuery && searchQuery.trim().length > 0) {
            const q = searchQuery.trim().toLowerCase()
            filtered = filtered.filter(p => {
                const fields = [p.name, p.description, p.shortDescription, p.category]
                const tags = Array.isArray(p.tags) ? p.tags : []
                const inText = fields.some(f => typeof f === 'string' && f.toLowerCase().includes(q))
                const inTags = tags.some(t => String(t).toLowerCase().includes(q))
                return inText || inTags
            })
        }

        // Sort products
        switch (sortBy) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price)
                break
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price)
                break
            case 'rating':
                filtered.sort((a, b) => {
                    const avgA = a.rating?.length ? a.rating.reduce((acc, r) => acc + r.rating, 0) / a.rating.length : 0
                    const avgB = b.rating?.length ? b.rating.reduce((acc, r) => acc + r.rating, 0) / b.rating.length : 0
                    return avgB - avgA
                })
                break
            case 'newest':
            default:
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                break
        }

        return filtered
    }, [products, filters, sortBy])

    const activeFiltersCount = 
        filters.categories.length + 
        (filters.minRating > 0 ? 1 : 0) + 
        (filters.inStock ? 1 : 0) +
        (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 ? 1 : 0)

    return (
        <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
                {/* Breadcrumb - Modern Style */}
                <div className="mb-8 flex items-center text-sm text-gray-500">
                    <a href="/" className="hover:text-gray-900 transition font-medium">Home</a>
                    <span className="mx-3 text-gray-300">/</span>
                    <span className="text-gray-900 font-semibold">All Jewellery</span>
                </div>

                {/* Header Section - Modern */}
                <div className="mb-12">
                    <h1 className="text-5xl md:text-6xl font-serif text-gray-900 mb-2">
                        All Jewellery
                    </h1>
                    <p className="text-lg text-gray-500 font-light">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} available
                    </p>
                </div>

                {/* Filter & Sort Bar - Modern Design */}
                <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-gray-200">
                    {/* Filter Button - Modern */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 border border-gray-300 px-4 py-2.5 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all font-medium text-gray-700 shadow-sm hover:shadow-md"
                    >
                        <FilterIcon size={18} />
                        <span>Filter</span>
                        {activeFiltersCount > 0 && (
                            <span className="ml-1 bg-orange-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* Active Filter Chips - Modern Styling */}
                    <div className="flex flex-wrap gap-2">
                        {filters.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {filters.categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm transition-colors"
                                    >
                                        <span className="font-medium">{cat}</span>
                                        <XIcon size={14} className="text-gray-500" />
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 100000] }))}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm transition-colors"
                            >
                                <span className="font-medium">AED {filters.priceRange[0].toLocaleString()} - AED {filters.priceRange[1].toLocaleString()}</span>
                                <XIcon size={14} className="text-gray-500" />
                            </button>
                        )}

                        {filters.minRating > 0 && (
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, minRating: 0 }))}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm transition-colors"
                            >
                                <span className="flex items-center gap-1 font-medium">
                                    <StarIcon size={14} className="fill-yellow-400 text-yellow-400" />
                                    {filters.minRating}+ Rating
                                </span>
                                <XIcon size={14} className="text-gray-500" />
                            </button>
                        )}

                        {filters.inStock && (
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, inStock: false }))}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm transition-colors"
                            >
                                <span className="font-medium">In Stock Only</span>
                                <XIcon size={14} className="text-gray-500" />
                            </button>
                        )}

                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-orange-600 hover:text-orange-700 font-semibold underline ml-2"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Sort Dropdown - Modern Design */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 shadow-sm"
                        >
                            <span className="text-gray-500">Sort By</span>
                            <span className="text-gray-900 font-semibold min-w-[130px] text-left">
                                {sortBy === 'newest' && 'Best Matches'}
                                {sortBy === 'price-low' && 'Price: Low to High'}
                                {sortBy === 'price-high' && 'Price: High to Low'}
                                {sortBy === 'rating' && 'Top Rated'}
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
                                        { value: 'rating', label: 'Top Rated' },
                                    ].map((option, idx) => (
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

                {/* Filter Modal - Only on Filter Click */}
                {showFilters && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setShowFilters(false)}></div>
                        
                        {/* Filter Panel - Modern Style */}
                        <div className="fixed inset-y-0 left-0 w-full sm:w-96 bg-white z-50 overflow-y-auto shadow-2xl">
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 p-6 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
                                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 transition rounded-lg p-1 hover:bg-gray-100">
                                    <XIcon size={24} />
                                </button>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Price Range - Always Visible */}
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-5">Price Range</h3>
                                    
                                    {/* Input Fields */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={filters.priceRange[0]}
                                            onChange={(e) => setFilters(prev => ({
                                                ...prev,
                                                priceRange: [Number(e.target.value) || 0, prev.priceRange[1]]
                                            }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                        />
                                        <span className="text-gray-400">to</span>
                                        <input
                                            type="number"
                                            placeholder="100000"
                                            value={filters.priceRange[1]}
                                            onChange={(e) => setFilters(prev => ({
                                                ...prev,
                                                priceRange: [prev.priceRange[0], Number(e.target.value) || 100000]
                                            }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                                                className={`px-4 py-2.5 text-sm rounded-lg border transition-all font-medium ${
                                                    filters.priceRange[0] === range.value[0] && filters.priceRange[1] === range.value[1]
                                                        ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                                }`}
                                            >
                                                {range.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-200"></div>
                            </div>

                            {/* Action Buttons - Fixed at Bottom */}
                            <div className="sticky bottom-0 bg-gradient-to-t from-white to-white/90 border-t border-gray-200 p-6 flex gap-3 backdrop-blur-sm">
                                <button
                                    onClick={clearFilters}
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-all"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-all shadow-md hover:shadow-lg"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex gap-6">

                    {/* Products Grid */}
                    <main className="flex-1">
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-gray-400 mb-4">
                                    <FilterIcon size={64} className="mx-auto" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-600 mb-6">Try adjusting your filters to see more results</p>
                                <button
                                    onClick={clearFilters}
                                    className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-medium"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}

export default function AllProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading products…</div>}>
            <ProductsContent />
        </Suspense>
    )
}
