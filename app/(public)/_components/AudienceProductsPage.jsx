'use client'

import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts } from '@/lib/features/product/productSlice'
import ProductCard from '@/components/ProductCard'

const AUDIENCE_KEYWORDS = {
  women: ['women', 'woman', 'ladies', 'girls'],
  men: ['men', 'man', 'gents', 'male', 'boys'],
  kids: ['kids', 'kid', 'children', 'child', 'baby', 'girls', 'boys'],
}

const toSearchableText = (product) => {
  const tags = Array.isArray(product?.tags) ? product.tags.join(' ') : ''
  const targetAudience = Array.isArray(product?.targetAudience)
    ? product.targetAudience.join(' ')
    : ''

  return [
    product?.name,
    product?.title,
    product?.category,
    product?.subcategory,
    product?.gender,
    targetAudience,
    tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function AudienceProductsPage({ audience, title }) {
  const dispatch = useDispatch()
  const products = useSelector((state) => state.product.list || [])

  useEffect(() => {
    dispatch(fetchProducts({}))
  }, [dispatch])

  const filteredProducts = useMemo(() => {
    const keywords = AUDIENCE_KEYWORDS[audience] || []

    return products
      .filter((product) => {
        if (Array.isArray(product?.targetAudience) && product.targetAudience.includes(audience)) {
          return true
        }
        const searchableText = toSearchableText(product)
        return keywords.some((keyword) => searchableText.includes(keyword))
      })
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
  }, [products, audience])

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <h1 className="text-4xl font-serif text-gray-900">{title}</h1>
        <p className="mt-2 text-gray-600">{filteredProducts.length} items</p>

        {filteredProducts.length === 0 ? (
          <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
            No products found right now.
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
