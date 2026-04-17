'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'

export default function PromotionBanner() {
  const [settings, setSettings] = useState({
    backgroundColor: '#fef3c7',
    leftSection: {
      title: '#GiftOfChdoice',
      titleColor: '#dc2626',
      subtitle: "Breathtaking gifts for your loved one's",
      subtitleColor: '#374151',
      price: 'STARTING AT AED10,000',
      priceColor: '#dc2626',
      buttonText: 'Explore Now',
      buttonLink: '/shop?collection=gifts',
      buttonColor: '#dc2626',
      buttonBgColor: '#dc2626'
    },
    rightSection: {
      branding: 'Thessah',
      brandingColor: '#f59e0b',
      title: 'Exchange your Old Gold',
      titleColor: '#111827',
      subtitle: 'for 100% Value!',
      subtitleColor: '#dc2626',
      description1: 'Unlock full value for your old gold today with',
      description1Color: '#2563eb',
      description2: 'our Exchange Program!',
      description2Color: '#111827',
      buttonText: 'Know more',
      buttonLink: '/exchange-gold',
      buttonColor: '#f59e0b',
      buttonBgColor: '#f59e0b'
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await axios.get('/api/store/settings')

      if (settingsRes.data.settings?.section6PromotionBanner) {
        setSettings(settingsRes.data.settings.section6PromotionBanner)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching section 6 data:', error)
      setLoading(false)
    }
  }

  return (
    <section className="w-full py-8 sm:py-10 lg:py-12" style={{ backgroundColor: settings.backgroundColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Section */}
          <div className="flex flex-col justify-center">
            {/* Decorative Cross Icon */}
            <div className="mb-8">
              <div className="relative w-20 h-20">
                {/* Vertical bar */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-20 bg-red-600"></div>
                </div>
                {/* Horizontal bar */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2 w-20 bg-red-600"></div>
                </div>
                {/* Center circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-red-600 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Content */}
            <h3 className="text-4xl sm:text-5xl font-serif mb-4" style={{ color: settings.leftSection.titleColor }}>
              {settings.leftSection.title}
            </h3>
            <p className="text-sm mb-2" style={{ color: settings.leftSection.subtitleColor }}>
              {settings.leftSection.subtitle}
            </p>
            <p className="text-lg font-bold mb-8" style={{ color: settings.leftSection.priceColor }}>
              {settings.leftSection.price}
            </p>
            <div>
              <Link
                href={settings.leftSection.buttonLink}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 font-semibold text-white transition-all duration-300 rounded-full text-sm hover:brightness-95 hover:-translate-y-0.5"
                style={{ 
                  borderColor: settings.leftSection.buttonColor, 
                  color: '#ffffff',
                  backgroundColor: settings.leftSection.buttonBgColor
                }}
              >
                {settings.leftSection.buttonText}
                <span>›</span>
              </Link>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-col justify-center">
            {/* Branding */}
            <p className="text-xs font-semibold tracking-widest mb-6" style={{ color: settings.rightSection.brandingColor }}>
              {settings.rightSection.branding}
            </p>

            {/* Main Heading */}
            <h2 className="text-4xl sm:text-5xl font-serif mb-3 leading-tight" style={{ color: settings.rightSection.titleColor }}>
              {settings.rightSection.title}
            </h2>
            
            {/* Red accent text */}
            <p className="text-2xl sm:text-3xl font-serif mb-6" style={{ color: settings.rightSection.subtitleColor }}>
              {settings.rightSection.subtitle}
            </p>

            {/* Descriptive text */}
            <div className="mb-8">
              <p className="text-sm mb-1" style={{ color: settings.rightSection.description1Color }}>
                {settings.rightSection.description1}
              </p>
              <p className="font-semibold" style={{ color: settings.rightSection.description2Color }}>
                {settings.rightSection.description2}
              </p>
            </div>

            {/* CTA Button */}
            <div>
              <Link
                href={settings.rightSection.buttonLink}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 font-semibold text-white transition-all duration-300 rounded-full text-sm hover:brightness-95 hover:-translate-y-0.5"
                style={{ 
                  borderColor: settings.rightSection.buttonColor, 
                  color: '#ffffff',
                  backgroundColor: settings.rightSection.buttonBgColor
                }}
              >
                {settings.rightSection.buttonText}
                <span>›</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
