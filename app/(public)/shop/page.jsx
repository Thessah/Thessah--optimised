"use client";
import { Suspense, useEffect, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard"
import { MoveLeftIcon, FilterIcon, XIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"

 function ShopContent() {
    const searchParams = useSearchParams();
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const router = useRouter();
    const products = useSelector(state => state.product.list);
    const [filters, setFilters] = useState({
        priceRange: [0, 100000],
        categories: category ? [category] : [],
        inStock: false
    });
    const [sortBy, setSortBy] = useState('newest');
    const [searchQuery, setSearchQuery] = useState('');

    // Fuzzy match helper (Levenshtein distance)
    function levenshtein(a, b) {
      const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
      for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
      for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      return matrix[a.length][b.length];
    }

    const categories = useMemo(() => {
        const cats = new Set();
        products.forEach(p => p.category && cats.add(p.category));
        return Array.from(cats).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        let filtered = [...products];
        if (filters.categories.length > 0) {
            filtered = filtered.filter(p => filters.categories.includes(p.category));
        }
        filtered = filtered.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);
        if (search) {
            const searchTerm = search.toLowerCase();
            filtered = filtered.filter(p => {
                const productName = (p.name || '').toLowerCase();
                const productSku = (p.sku || '').toLowerCase();
                const productBarcode = (p.barcode || '').toLowerCase();
                return (
                    productName.includes(searchTerm) ||
                    productSku.includes(searchTerm) ||
                    productBarcode.includes(searchTerm) ||
                    levenshtein(productName, searchTerm) <= 2
                );
            });
        }
        switch (sortBy) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            default:
                filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        return filtered;
    }, [products, filters, sortBy, search]);

    const pageTitle = category 
        ? category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : search 
        ? `Search: ${search}`
        : 'All Jewellery';

    const activeFilterCount = filters.categories.length + (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 ? 1 : 0);

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-6">
                    {category ? pageTitle : search ? `Search: ${search}` : 'All Jewellery'} <span className="text-gray-500 text-xl">({filteredProducts.length} results)</span>
                </h1>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b">
                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
                    >
                        <FilterIcon size={18} />
                        Filter
                        {activeFilterCount > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                                {activeFilterCount}
                            </span>
                        )}
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

                    {/* Category Quick Filters */}
                    {categories.slice(0, 5).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilters(prev => ({
                                ...prev,
                                categories: prev.categories.includes(cat)
                                    ? prev.categories.filter(c => c !== cat)
                                    : [...prev.categories, cat]
                            }))}
                            className={`px-3 py-1.5 text-sm ${filters.categories.includes(cat) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border border-gray-300 text-gray-700'} rounded flex items-center gap-1`}
                        >
                            {cat}
                            {filters.categories.includes(cat) && <XIcon size={12} />}
                        </button>
                    ))}

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

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-32">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => <ProductCard key={product._id || product.id} product={product} />)
                    ) : (
                        <div className="col-span-full text-center py-12">
                            <p className="text-gray-500 text-lg">No products found</p>
                            <button 
                                onClick={() => router.push('/shop')}
                                className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


export default function Shop() {
  return (
    <Suspense fallback={<div>Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}