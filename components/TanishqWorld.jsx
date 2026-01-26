'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'

export default function TanishqWorld() {
  const [heading, setHeading] = useState({
    title: 'Thessah World',
    subtitle: 'A companion for every occasion'
  })
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    // Removed polling to avoid flicker; component updates on save/refresh
    return () => {}
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await axios.get('/api/store/settings')
      console.log('🔍 Full settings response:', settingsRes.data.settings)

      // Load heading
      const dbHeading = settingsRes.data.settings?.section4Heading
      if (dbHeading) {
        setHeading({
          title: dbHeading.title || 'Thessah World',
          subtitle: dbHeading.subtitle || 'A companion for every occasion'
        })
      }

      // Load collections
      if (settingsRes.data.settings?.section4Collections) {
        const dbCollections = settingsRes.data.settings.section4Collections
        console.log('📦 Collections from DB:', dbCollections)
        // Be permissive: keep items that have at least a title or image
        const validCollections = (Array.isArray(dbCollections) ? dbCollections : [])
          .filter(col => col && (col.title || col.image))
          .map(col => ({
            title: col.title || '',
            image: col.image || '',
            link: col.link || '#'
          }))
        console.log('✅ Collections to render:', validCollections)
        setCollections(validCollections)
      } else {
        console.log('❌ No section4Collections in settings')
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching section 4 data:', error)
      setLoading(false)
    }
  }

  console.log('Current state - collections:', collections, 'loading:', loading)

  if (collections.length === 0 && !loading) {
    console.log('⚠️ Not rendering - no valid collections')
    return null // Don't render if no collections selected
  }

  return (
    <section className="w-full bg-white py-8 sm:py-10 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-gray-900 mb-2">
            {heading.title}
          </h2>
          <p className="text-base sm:text-lg text-gray-500 font-light">
            {heading.subtitle}
          </p>
        </div>

        {/* Mobile: Horizontal Carousel */}
        <div className="sm:hidden relative">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-2">
            {collections.length === 0 ? (
              <div className="w-full text-center text-gray-500">
                No collections configured yet.
              </div>
            ) : collections.map((collection, index) => (
              <Link
                key={index}
                href={collection.link || '#'}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 flex-shrink-0 w-[85vw] h-[300px] snap-center"
              >
                {/* Background Image */}
                {collection.image && (
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                )}
                
                {/* Title */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-3xl font-serif text-white drop-shadow-2xl">
                    {collection.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Carousel Indicators */}
          {collections.length > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              {collections.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-gray-300"
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop: Grid Layout - 2x2 */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-4 sm:gap-6">
          {collections.length === 0 ? (
            <div className="col-span-2 text-center text-gray-500">
              No collections configured yet.
            </div>
          ) : collections.map((collection, index) => (
            <Link
              key={index}
              href={collection.link || '#'}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 h-[350px] lg:h-[400px]"
            >
              {/* Background Image */}
              {collection.image && (
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              )}
              
              {/* Title */}
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white drop-shadow-2xl">
                  {collection.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  )
}
