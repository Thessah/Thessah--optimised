'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const COLLECTIONS_CACHE_KEY = 'collections:data:v1'
const SETTINGS_CACHE_KEY = 'collections:heading:v1'
const TTL_MS = 10 * 60 * 1000 // 10 minutes

export default function CollectionsShowcase() {
  const [collections, setCollections] = useState([])
  const [heading, setHeading] = useState({
    title: 'Thessah Collections',
    subtitle: 'Explore our newly launched collection',
    visible: true
  })

  const fetchData = async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort('timeout'), 6000)

    try {
      const [collectionsRes, settingsRes] = await Promise.all([
        fetch('/api/store/collections', { cache: 'no-store', signal: controller.signal }),
        fetch('/api/store/settings', { cache: 'no-store', signal: controller.signal })
      ])

      if (collectionsRes.ok) {
        const data = await collectionsRes.json()
        if (Array.isArray(data?.collections) && data.collections.length > 0) {
          const activeCollections = data.collections.filter(c => c && c.isActive !== false)
          setCollections(activeCollections)
          try { sessionStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: activeCollections })) } catch {}
        }
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        if (data?.settings?.collectionsHeading) {
          setHeading(data.settings.collectionsHeading)
          try { sessionStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data.settings.collectionsHeading })) } catch {}
        }
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        // Expected in slow networks due to timeout.
        return
      }
      console.error('Error fetching collections:', error)
    } finally {
      clearTimeout(timer)
    }
  }

  // Fetch on mount with cache-first and gentle revalidate
  useEffect(() => {
    // Serve cached data immediately if fresh
    try {
      const rawCollections = sessionStorage.getItem(COLLECTIONS_CACHE_KEY)
      if (rawCollections) {
        const cached = JSON.parse(rawCollections)
        if (cached && Array.isArray(cached.data) && (Date.now() - cached.ts < TTL_MS)) {
          setCollections(cached.data)
        }
      }
      const rawHeading = sessionStorage.getItem(SETTINGS_CACHE_KEY)
      if (rawHeading) {
        const cached = JSON.parse(rawHeading)
        if (cached?.data && (Date.now() - cached.ts < TTL_MS)) {
          setHeading(cached.data)
        }
      }
    } catch {}

    fetchData()

    // Gentle refresh every 10 minutes
    const interval = setInterval(fetchData, TTL_MS)
    return () => clearInterval(interval)
  }, [])

  // Separate collections by size
  const largeCollections = collections.filter(c => c.size === 'large')
  const smallCollections = collections.filter(c => c.size === 'small' || !c.size)
  
  // Get up to 1 large and 2 small
  const featuredCollection = largeCollections[0]
  const gridCollections = smallCollections.slice(0, 2)

  // Don't render if no collections or if section is hidden
  const isVisible = heading.visible !== false
  
  if (collections.length === 0) return null
  if (!isVisible) return null
  if (!featuredCollection && gridCollections.length === 0) return null

  return (
    <section className="w-full bg-white py-8 sm:py-10 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-gray-900 mb-2">
            {heading.title}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 font-light">
            {heading.subtitle}
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {featuredCollection && (
            <>
              {/* Large Card - Featured Collection */}
              <Link
                href={featuredCollection.link}
                className="group relative h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <img
                  src={featuredCollection.image}
                  alt={featuredCollection.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white drop-shadow-lg">
                    {featuredCollection.title}
                  </h3>
                  {featuredCollection.subtitle && (
                    <p className="text-lg sm:text-xl text-white/90 font-light drop-shadow-lg">
                      {featuredCollection.subtitle}
                    </p>
                  )}
                </div>
              </Link>

              {/* Small Cards - Right */}
              {gridCollections.length > 0 && (
                <div className="grid grid-rows-2 gap-4 sm:gap-6">
                  {gridCollections.map((collection, index) => (
                    <Link
                      key={collection._id || index}
                      href={collection.link}
                      className="group relative h-[200px] sm:h-[240px] lg:h-[294px] overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500"
                    >
                      <img
                        src={collection.image}
                        alt={collection.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      <div className="absolute bottom-6 right-6 text-right">
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-white drop-shadow-lg">
                          {collection.title}
                        </h3>
                        {collection.subtitle && (
                          <p className="text-xl sm:text-2xl lg:text-3xl font-serif text-white/90 italic drop-shadow-lg">
                            {collection.subtitle}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Show small cards only if no large collection */}
          {!featuredCollection && gridCollections.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:col-span-2">
              {gridCollections.map((collection, index) => (
                <Link
                  key={collection._id || index}
                  href={collection.link}
                  className="group relative h-[300px] sm:h-[350px] overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl sm:text-3xl font-serif text-white drop-shadow-lg">
                      {collection.title}
                    </h3>
                    {collection.subtitle && (
                      <p className="text-lg sm:text-xl font-serif text-white/90 italic drop-shadow-lg">
                        {collection.subtitle}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
