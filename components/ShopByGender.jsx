'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'

export default function ShopByGender() {
  const [heading, setHeading] = useState({
    title: 'Curated For You',
    subtitle: 'Shop By Gender'
  })
  const [genderCategories, setGenderCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    // Removed polling to avoid flicker; component updates on save/refresh
    return () => {}
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await axios.get('/api/store/settings')

      // Load heading
      const dbHeading = settingsRes.data.settings?.section5Heading
      if (dbHeading) {
        setHeading({
          title: dbHeading.title || 'Curated For You',
          subtitle: dbHeading.subtitle || 'Shop By Gender'
        })
      }

      // Load gender categories
      if (settingsRes.data.settings?.section5GenderCategories) {
        const dbCategories = settingsRes.data.settings.section5GenderCategories
        // Be permissive: accept items with at least a title or image
        const validCategories = (Array.isArray(dbCategories) ? dbCategories : [])
          .filter(cat => cat && (cat.title || cat.image))
          .map(cat => ({
            title: cat.title || '',
            image: cat.image || '',
            link: cat.link || '#'
          }))
        setGenderCategories(validCategories)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching section 5 data:', error)
      setLoading(false)
    }
  }

  if (genderCategories.length === 0 && !loading) {
    return null // Don't render if no categories
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

        {/* Mobile: Horizontal Carousel | Desktop: Grid */}
        <div className="sm:hidden relative">
          {/* Mobile Carousel */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 px-2">
            {genderCategories.map((category, index) => (
              <Link
                key={index}
                href={category.link || '#'}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 flex-shrink-0 w-[85vw] snap-center"
              >
                {/* Background Image */}
                <div className="aspect-[3/4] relative">
                  {category.image && (
                    <img
                      src={category.image}
                      alt={category.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
                
                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  <h3 className="text-xl font-serif text-white drop-shadow-lg">
                    {category.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {genderCategories.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-gray-300"
              />
            ))}
          </div>
        </div>

        {/* Desktop: Three Column Grid */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-4 sm:gap-6">
          {genderCategories.map((category, index) => (
            <Link
              key={index}
              href={category.link || '#'}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              {/* Background Image */}
              <div className="aspect-[3/4] relative">
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
              
              {/* Title */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                <h3 className="text-xl sm:text-2xl font-serif text-white drop-shadow-lg">
                  {category.title}
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
