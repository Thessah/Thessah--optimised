'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

export default function ThessahExperience() {
  const [heading, setHeading] = useState({
    title: 'Thessah Experience',
    subtitle: 'Find a Boutique or Book a Consultation'
  })
  const [experiences, setExperiences] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await axios.get('/api/store/settings')

      if (settingsRes.data.settings?.section7Heading) {
        setHeading(settingsRes.data.settings.section7Heading)
      }

      if (settingsRes.data.settings?.section7Experiences) {
        const dbExperiences = settingsRes.data.settings.section7Experiences
        // Normalize image key to support legacy payloads.
        const validExperiences = dbExperiences
          .map((exp) => ({
            ...exp,
            image: exp.image || exp.imageUrl || exp.bannerImage || ''
          }))
          .filter(exp => exp.title)
        setExperiences(validExperiences)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching section 7 data:', error)
      setLoading(false)
    }
  }

  // Show section even if no experiences are configured yet
  if (loading) {
    return null
  }

  return (
    <section className="w-full bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16 lg:py-20">
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

        {/* Grid Layout - 3 columns x 2 rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiences.length > 0 ? experiences.map((experience, index) => (
            <Link
              key={index}
              href={experience.link || '#'}
              className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 bg-white"
            >
              {/* Image Container */}
              <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                {experience.image ? (
                  <img
                    src={experience.image}
                    alt={experience.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Title */}
              <div className="p-4 text-center bg-white">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 uppercase tracking-wide">
                  {experience.title}
                </h3>
              </div>
            </Link>
          )) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No experiences configured yet. Go to <Link href="/store/section-7" className="text-blue-600 hover:underline">/store/section-7</Link> to add them.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
