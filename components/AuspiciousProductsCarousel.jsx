'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchProducts } from '@/lib/features/product/productSlice'
import axios from 'axios'

const getImageSrc = (product) => {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    const first = product.images[0]
    if (typeof first === 'string' && first) return first
    if (first?.url) return first.url
    if (first?.src) return first.src
  }
  return 'https://ik.imagekit.io/jrstupuke/placeholder.png'
}

const formatPrice = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return `AED ${Math.round(n)}`
}

const normalize = (value) => String(value || '').trim().toLowerCase()

export default function AuspiciousProductsCarousel() {
  const dispatch = useDispatch()
  const list = useSelector((state) => state.product.list || [])
  const railRef = useRef(null)
  const [heading, setHeading] = useState({
    title: 'For an Auspicious Beginning',
    subtitle: 'Discover our most-loved designs, curated for this Akshaya Tritiya',
    image: '',
    visible: true
  })
  const [selectedCategoryNames, setSelectedCategoryNames] = useState([])

  useEffect(() => {
    if (list.length === 0) {
      dispatch(fetchProducts({ limit: 48 }))
    }
  }, [dispatch, list.length])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await axios.get('/api/store/settings')
        const settings = data?.settings || {}

        if (settings?.section8Heading) {
          setHeading((prev) => ({
            ...prev,
            ...settings.section8Heading
          }))
        }

        const display = settings?.section8Display || {}
        const names = Array.isArray(display?.selectedCategoryNames)
          ? display.selectedCategoryNames.filter(Boolean)
          : []
        setSelectedCategoryNames(names)
      } catch (error) {
        console.error('Failed to load section 8 settings:', error)
      }
    }

    loadSettings()
  }, [])

  const products = useMemo(() => {
    const base = list.filter((p) => p && (p._id || p.id) && (p.slug || p._id || p.id))

    if (selectedCategoryNames.length === 0) {
      return base.slice(0, 12)
    }

    const orderedNames = selectedCategoryNames.map(normalize).filter(Boolean)
    const buckets = orderedNames.map((cat) =>
      base.filter((p) => normalize(p?.category) === cat)
    )

    const mixed = []
    let progressed = true
    while (mixed.length < 12 && progressed) {
      progressed = false
      for (const bucket of buckets) {
        if (bucket.length > 0) {
          mixed.push(bucket.shift())
          progressed = true
          if (mixed.length >= 12) break
        }
      }
    }

    return mixed.length > 0 ? mixed : base.slice(0, 12)
  }, [list, selectedCategoryNames])

  if (heading.visible === false || products.length === 0) return null

  const scrollByCards = (direction) => {
    if (!railRef.current) return
    const card = railRef.current.querySelector('[data-card]')
    if (!card) return
    const gap = 20
    const amount = card.clientWidth + gap
    railRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    })
  }

  return (
    <section className="w-full bg-[#f7f7f7] py-10 sm:py-12">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative text-center mb-7 sm:mb-9">
          <h2 className="text-[36px] sm:text-[52px] leading-tight font-serif text-[#2f0d12]">
            {heading.title || 'For an Auspicious Beginning'}
          </h2>
          <p className="text-[16px] sm:text-[22px] mt-1 text-[#9d8576] font-light leading-tight max-w-[900px] mx-auto">
            {heading.subtitle || 'Discover our most-loved designs, curated for this Akshaya Tritiya'}
          </p>

          {heading.image && (
            <div className="mt-4 mx-auto w-full max-w-[540px]">
              <div className="relative h-[120px] sm:h-[160px] rounded-xl overflow-hidden shadow-sm">
                <Image
                  src={heading.image}
                  alt={heading.title || 'Section 8 banner'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 540px"
                />
              </div>
            </div>
          )}

          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-4">
            <button
              onClick={() => scrollByCards('left')}
              className="p-1.5 text-[#8c6a66] hover:text-[#5b2726] transition"
              aria-label="Previous products"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              onClick={() => scrollByCards('right')}
              className="p-1.5 text-[#8c6a66] hover:text-[#5b2726] transition"
              aria-label="Next products"
            >
              <ChevronRight size={26} />
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => {
            const productName = product.name || product.title || 'Product'
            const priceText = formatPrice(product.price || product.AED)

            return (
              <Link
                key={product._id || product.id}
                href={`/product/${product.slug || product._id || product.id}`}
                data-card
                className="snap-start shrink-0 w-[76%] sm:w-[45%] lg:w-[24%]"
              >
                <div className="rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                  <div className="relative aspect-[4/4] bg-gray-100">
                    <Image
                      src={getImageSrc(product)}
                      alt={productName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 76vw, (max-width: 1024px) 45vw, 24vw"
                    />
                  </div>
                </div>

                <p className="mt-3 text-[15px] sm:text-[17px] text-[#1f1b1b] font-serif truncate leading-tight">
                  {productName}
                </p>
                {priceText && (
                  <p className="text-[16px] sm:text-[18px] leading-tight text-[#1f1b1b] font-serif mt-1">
                    {priceText}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
