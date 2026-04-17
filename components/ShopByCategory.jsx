'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CACHE_KEY = 'shop-categories:v1'
const CACHE_TTL_MS = 5 * 60 * 1000

export default function ShopByCategory() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [heading, setHeading] = useState({
    title: '',
    subtitle: ''
  })

  useEffect(() => {
    // Serve warm cache instantly for better first paint
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const cached = JSON.parse(raw)
        if (cached?.data && Date.now() - cached.ts < CACHE_TTL_MS) {
          setHeading(cached.data.heading || {
            title: 'Find Your Perfect Match',
            subtitle: 'Shop by Categories'
          })
          setCategories(Array.isArray(cached.data.categories) ? cached.data.categories : [])
          setLoading(false)
        }
      }
    } catch {}

    const fetchData = async () => {
      try {
        const nextDefaults = {
          title: 'Find Your Perfect Match',
          subtitle: 'Shop by Categories'
        }
        const res = await fetch('/api/store/shop-categories', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
        let nextHeading = data?.heading || nextDefaults
        let nextCategories = Array.isArray(data?.categories) ? data.categories : []

        // Fallback: when combined API returns empty categories, resolve from source APIs.
        if (nextCategories.length === 0) {
          const [categoriesRes, settingsRes] = await Promise.all([
            fetch('/api/store/categories', { cache: 'no-store' }),
            fetch('/api/store/settings', { cache: 'no-store' })
          ])

          if (categoriesRes.ok && settingsRes.ok) {
            const categoriesData = await categoriesRes.json()
            const settingsData = await settingsRes.json()
            const settings = settingsData?.settings || {}

            nextHeading = settings?.shopCategoriesHeading || nextHeading

            const selectedIds = Array.isArray(settings?.shopCategoriesDisplay?.selectedIds)
              ? settings.shopCategoriesDisplay.selectedIds.map((id) => String(id))
              : []

            const allCategories = Array.isArray(categoriesData?.categories)
              ? categoriesData.categories
              : []

            const parentCategories = allCategories.filter((cat) => !cat.parentId)
            let pickedCategories = parentCategories

            if (selectedIds.length > 0) {
              const selectedSet = new Set(selectedIds)
              const selectedPool = parentCategories.filter((cat) =>
                selectedSet.has(String(cat._id))
              )

              const orderedSelected = selectedIds
                .map((id) => selectedPool.find((cat) => String(cat._id) === id))
                .filter(Boolean)

              pickedCategories = orderedSelected.length > 0 ? orderedSelected : parentCategories
            }

            nextCategories = pickedCategories.slice(0, 7).map((cat) => ({
              _id: cat._id,
              title: cat.name,
              image: cat.image,
              link: `/category/${cat.slug || cat._id}`,
              isActive: true
            }))
          }
        }

        setHeading(nextHeading)
        setCategories(nextCategories)
        setLoading(false)

        try {
          if (nextCategories.length > 0) {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({
              ts: Date.now(),
              data: {
                heading: nextHeading,
                categories: nextCategories
              }
            }))
          }
        } catch {}
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const skeletonCards = Array.from({ length: 8 })

  return (
    <section className="w-full bg-white py-8 sm:py-10 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          {loading ? (
            <>
              <div className="h-10 sm:h-12 lg:h-14 w-[320px] sm:w-[460px] max-w-full bg-gray-200 rounded-lg mx-auto animate-pulse mb-3" />
              <div className="h-6 w-44 sm:w-52 bg-gray-200 rounded-lg mx-auto animate-pulse" />
            </>
          ) : (
            <>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-gray-900 mb-2">
                {heading.title}
              </h2>
              <p className="text-base sm:text-lg text-gray-500 font-light">
                {heading.subtitle}
              </p>
            </>
          )}
        </div>

        {/* Category Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {skeletonCards.map((_, idx) => (
              <div key={idx} className="aspect-square rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category) => (
              <Link
                key={category._id || category.id}
                href={category.link}
                className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500"
              >
                {category.isViewAll ? (
                  // View All Card
                  <div className="aspect-square bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col items-center justify-center p-6">
                    <div className="text-center">
                      <p className="text-5xl sm:text-6xl font-bold text-amber-800 mb-2">10+</p>
                      <p className="text-sm text-gray-600 mb-1">Categories to chose from</p>
                    </div>
                    <p className="mt-4 text-base font-semibold text-gray-900 uppercase tracking-wide">
                      {category.title}
                    </p>
                  </div>
                ) : (
                  // Regular Category Card
                  <>
                    <div className="aspect-square relative bg-gray-200">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <span className="text-gray-500">No image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                      <h3 className="text-sm sm:text-base font-semibold text-white uppercase tracking-wide">
                        {category.title}
                      </h3>
                    </div>
                  </>
                )}
              </Link>
            ))}
            
            {/* Add View All Card if we have categories */}
            <Link
              href="/browse-history"
              className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500"
            >
              <div className="aspect-square bg-gradient-to-br from-amber-50 to-amber-100 flex flex-col items-center justify-center p-6">
                <p className="text-5xl sm:text-6xl font-bold text-amber-800 mb-2">10+</p>
                <p className="text-sm text-gray-600 mb-4">Categories to chose from</p>
                <p className="text-base font-semibold text-gray-900 uppercase tracking-wide">VIEW ALL</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories available</p>
          </div>
        )}
      </div>
    </section>
  )
}
