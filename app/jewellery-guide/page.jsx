'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import {
  CalendarDays,
  ChevronDown,
  Crown,
  Gem,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UserRound
} from 'lucide-react'
import { Cormorant_Garamond, Inter, Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['500', '600', '700'] })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'] })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

const defaultGuide = {
  enabled: true,
  hero: {
    title: 'Timeless Jewellery for Every Moment',
    subtitle: 'Elegant handcrafted pieces designed to elevate your everyday style.',
    image: ''
  },
  intro: 'Your guide to choosing, styling, and caring for jewellery that reflects your true elegance.',
  sections: [],
  faqs: []
}

const defaultGuideCards = [
  {
    title: 'Know Your Style',
    content: 'Classic, modern, or traditional, choose pieces that reflect your personality.',
    Icon: UserRound
  },
  {
    title: 'Consider the Occasion',
    content: 'Delicate pieces for everyday elegance and statement jewels for celebrations.',
    Icon: CalendarDays
  },
  {
    title: 'Metal Matters',
    content: 'Gold, rose gold, silver, or platinum, pick the tone that suits your wardrobe.',
    Icon: Gem
  },
  {
    title: 'Perfect Fit',
    content: 'The right fit ensures comfort and confidence throughout the day.',
    Icon: Crown
  }
]

const defaultStylingCards = [
  {
    title: 'Layer with Intention',
    content: 'Layer fine necklaces for a modern, effortless look.',
    image: '/jewellery-guide/style-main1.webp'
  },
  {
    title: 'Balance is Key',
    content: 'If your earrings are bold, keep your necklace subtle.',
    image: '/jewellery-guide/style-ear.webp'
  },
  {
    title: 'Stack & Shine',
    content: 'Stack rings or bangles for a chic, personalized style.',
    image: '/jewellery-guide/style-main2.webp'
  },
  {
    title: 'Less is More',
    content: 'Sometimes, a single statement piece says it all.',
    image: '/jewellery-guide/style-wedding.jpg'
  }
]

const defaultCareTips = [
  {
    question: 'Keep it Dry',
    answer: 'Avoid water, perfumes, and harsh chemicals to maintain brilliance.'
  },
  {
    question: 'Store Safely',
    answer: 'Store each piece separately in soft pouches or a jewellery box.'
  },
  {
    question: 'Clean Gently',
    answer: 'Use a soft cloth after each wear to remove oils and dust.'
  },
  {
    question: 'Wear with Care',
    answer: 'Put jewellery on last and remove first to avoid scratches.'
  }
]

const featuredCollections = [
  {
    title: 'Everyday Elegance',
    image: '/jewellery-guide/style-main1.webp',
    href: '/shop'
  },
  {
    title: 'Workwear Chic',
    image: '/jewellery-guide/style-ear.webp',
    href: '/shop'
  },
  {
    title: 'Festive Glam',
    image: '/jewellery-guide/style-main2.webp',
    href: '/shop'
  },
  {
    title: 'Bridal Brilliance',
    image: '/jewellery-guide/style-wedding.jpg',
    href: '/shop'
  }
]

export default function JewelleryGuidePage() {
  const [loading, setLoading] = useState(true)
  const [guide, setGuide] = useState(defaultGuide)
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  useEffect(() => {
    const loadGuide = async () => {
      try {
        const { data } = await axios.get('/api/store/settings')
        const incoming = data?.settings?.jewelleryGuide || {}
        setGuide({
          ...defaultGuide,
          ...incoming,
          hero: {
            ...defaultGuide.hero,
            ...(incoming.hero || {})
          },
          sections: (incoming.sections || []).map((section) => ({
            title: section.title || '',
            content: section.content || '',
            image: section.image || '',
            visible: section.visible !== false
          })),
          faqs: (incoming.faqs || []).map((faq) => ({
            question: faq.question || '',
            answer: faq.answer || ''
          }))
        })
      } catch {
        setGuide(defaultGuide)
      } finally {
        setLoading(false)
      }
    }

    loadGuide()
  }, [])

  useEffect(() => {
    if (loading) return

    const nodes = document.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16 }
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [loading])

  const visibleSections = useMemo(
    () => (guide.sections || []).filter((section) => section.visible !== false),
    [guide.sections]
  )

  const heroImage = guide.hero.image || '/jewellery-guide/hero-photo.webp'

  const guideCards = useMemo(() => {
    const fromSettings = visibleSections.slice(0, 4).map((section, index) => ({
      title: section.title || defaultGuideCards[index]?.title || `Tip ${index + 1}`,
      content: section.content || defaultGuideCards[index]?.content || '',
      Icon: defaultGuideCards[index]?.Icon || Gem
    }))

    if (fromSettings.length === 4) return fromSettings
    return defaultGuideCards
  }, [visibleSections])

  const stylingCards = useMemo(() => {
    const fromSettings = visibleSections.slice(4, 8).map((section, index) => ({
      title: section.title || defaultStylingCards[index]?.title || `Style ${index + 1}`,
      content: section.content || defaultStylingCards[index]?.content || '',
      image: section.image || defaultStylingCards[index]?.image || '/jewellery-guide/style-1.svg'
    }))

    if (fromSettings.length === 4) return fromSettings
    return defaultStylingCards
  }, [visibleSections])

  const careTips = useMemo(() => {
    const fromFaq = (guide.faqs || []).slice(0, 4)
    if (fromFaq.length === 4) return fromFaq
    return defaultCareTips
  }, [guide.faqs])

  if (loading) {
    return (
      <div className={`${inter.className} max-w-6xl mx-auto px-4 py-16`}>
        <p className="text-sm text-[#6a5a4a]">Loading luxury experience...</p>
      </div>
    )
  }

  if (!guide.enabled) {
    return (
      <div className={`${inter.className} max-w-6xl mx-auto px-4 py-16`}>
        <h1 className={`${playfair.className} text-4xl text-[#3A2A20]`}>Jewellery Guide</h1>
        <p className="mt-3 text-[#5f4c3f]">This page is currently unavailable.</p>
      </div>
    )
  }

  return (
    <main className={`${inter.className} luxury-root bg-[#F8F4EE] text-[#3A2A20]`}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.75),transparent_42%),radial-gradient(circle_at_82%_22%,rgba(200,164,107,0.18),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-35">
          {Array.from({ length: 14 }).map((_, index) => (
            <span
              key={`particle-${index}`}
              className="luxury-particle"
              style={{
                left: `${8 + index * 6.6}%`,
                top: `${12 + (index % 5) * 14}%`,
                animationDelay: `${index * 0.5}s`
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-6 md:pt-14 md:pb-10">
          <div data-reveal className="luxury-reveal rounded-[2rem] border border-[#D5BE9A] bg-gradient-to-br from-[#F4E8D8]/90 to-[#FCF8F1]/95 shadow-[0_24px_70px_rgba(76,52,30,0.12)] backdrop-blur-sm overflow-hidden">
            <div className="grid lg:grid-cols-12">
              <div className="relative lg:col-span-5 min-h-[380px] md:min-h-[560px]">
                <img src={heroImage} alt="Luxury jewellery campaign" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
                <div className="absolute left-7 bottom-6 rounded-2xl px-4 py-3 bg-white/18 border border-white/25 backdrop-blur-md text-[#fef4e7]">
                  <p className={`${cormorant.className} text-3xl md:text-4xl leading-none`}>Jewellery Guide</p>
                </div>
              </div>

              <div className="lg:col-span-4 px-6 py-8 md:p-10 flex flex-col justify-center">
                <p className="text-xs tracking-[0.28em] uppercase text-[#B1844D] mb-4">Saha.ae</p>
                <h1 className={`${playfair.className} text-[2.6rem] md:text-[4.1rem] leading-[0.92] text-[#3A2A20]`}>
                  {guide.hero.title}
                </h1>
                <div className="flex items-center gap-3 mt-6 mb-5 text-[#C8A46B]">
                  <span className="h-px w-12 bg-[#C8A46B]" />
                  <Sparkles className="w-4 h-4" />
                  <span className="h-px w-12 bg-[#C8A46B]" />
                </div>
                <p className="text-[#5A473A] text-base md:text-lg leading-8">{guide.hero.subtitle}</p>
                <p className="text-[#6B594B] text-sm leading-6 mt-4">{guide.intro}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/shop" className="luxury-btn-primary">Shop Collection</Link>
                  <a href="#guide" className="luxury-btn-secondary">Explore Guide</a>
                </div>
              </div>

              <aside className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-[#D8C3A5] bg-[#FCF7EF] p-6">
                <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#876437] mb-4">Timeless Beauty Thoughtfully Chosen</p>
                <div className="space-y-4">
                  {[
                    { title: 'Quality Craftsmanship', text: 'Finely crafted pieces made to last.', Icon: Gem },
                    { title: 'Timeless Designs', text: 'Elegant designs that never go out of style.', Icon: Sparkles },
                    { title: 'Ethically Sourced', text: 'Responsibly sourced materials you can feel good about.', Icon: ShieldCheck },
                    { title: 'Perfect For Every Moment', text: 'From everyday wear to life moments that matter.', Icon: Heart }
                  ].map(({ title, text, Icon }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full border border-[#C8A46B] text-[#B08653] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#3D2D24]">{title}</p>
                        <p className="text-xs text-[#604E40] leading-5">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section id="guide" className="max-w-7xl mx-auto px-4 pt-3 pb-2">
        <div data-reveal className="luxury-reveal luxury-panel p-5 md:p-8">
          <h2 className={`${cormorant.className} text-center text-[2.1rem] md:text-[2.6rem] text-[#3A2A20]`}>How To Choose The Right Jewellery</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {guideCards.map(({ title, content, Icon }) => (
              <article key={title} className="luxury-card group">
                <div className="w-12 h-12 mx-auto rounded-full border border-[#C8A46B] text-[#AD834F] flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xs uppercase tracking-[0.12em] font-semibold text-[#5D4430]">{title}</h3>
                <p className="text-sm text-[#5E4B3C] leading-6 mt-2">{content}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-3 pb-2">
        <div data-reveal className="luxury-reveal luxury-panel p-5 md:p-8">
          <h2 className={`${cormorant.className} text-center text-[2.1rem] md:text-[2.6rem] text-[#3A2A20]`}>Styling Tips</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {stylingCards.map((card) => (
              <article key={card.title} className="group rounded-2xl overflow-hidden border border-[#DFC6A7] bg-[#FFF9F1] shadow-[0_10px_28px_rgba(76,52,30,0.08)]">
                <div className="overflow-hidden">
                  <img src={card.image} alt={card.title} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-sm uppercase tracking-[0.12em] font-semibold text-[#5C4431]">{card.title}</h3>
                  <p className="text-sm text-[#624F3F] leading-6 mt-2">{card.content}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-3 pb-2">
        <div className="grid lg:grid-cols-2 gap-4 md:gap-5">
          <article data-reveal className="luxury-reveal luxury-panel p-5 md:p-7">
            <h2 className={`${cormorant.className} text-[2rem] md:text-[2.4rem] text-[#3A2A20] mb-4`}>Jewellery Care Guide</h2>
            <div className="grid md:grid-cols-2 gap-5 items-start">
              <div className="space-y-4">
                {careTips.map((tip, index) => (
                  <div key={tip.question || `tip-${index}`} className="flex gap-3">
                    <div className="mt-1 w-8 h-8 rounded-full border border-[#C8A46B] text-[#A97D49] flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm uppercase tracking-[0.08em] font-semibold text-[#5D4330]">{tip.question}</h3>
                      <p className="text-sm text-[#624F3F] mt-1 leading-6">{tip.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
              <img src="/jewellery-guide/care-photo.webp" alt="Luxury jewellery box" className="w-full h-64 object-cover rounded-2xl border border-[#DFC6A7]" />
            </div>
          </article>

          <article data-reveal className="luxury-reveal luxury-panel p-5 md:p-7 flex flex-col justify-center">
            <h2 className={`${cormorant.className} text-center text-[2rem] md:text-[2.8rem] text-[#3A2A20]`}>Jewellery For Every You</h2>
            <p className="text-center text-[#604F42] mt-3 leading-7">Because every moment, every mood and every you deserves to shine.</p>
            <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Everyday Elegance', Icon: Heart },
                { label: 'Workwear Chic', Icon: Sparkles },
                { label: 'Festive Glam', Icon: Star },
                { label: 'Bridal Brilliance', Icon: Gem }
              ].map(({ label, Icon }) => (
                <div key={label} className="rounded-xl bg-[#FFF9F0] border border-[#E5CFB2] p-3">
                  <div className="w-10 h-10 rounded-full border border-[#C8A46B] text-[#A77A45] flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.1em] text-[#5A4332]">{label}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section id="collections" className="max-w-7xl mx-auto px-4 pt-3 pb-2">
        <div data-reveal className="luxury-reveal luxury-panel p-5 md:p-8">
          <h2 className={`${cormorant.className} text-center text-[2.1rem] md:text-[2.6rem] text-[#3A2A20]`}>Featured Collections</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {featuredCollections.map((item) => (
              <Link href={item.href} key={item.title} className="group rounded-2xl overflow-hidden border border-[#DFC6A7] bg-[#FFF9F0] shadow-[0_12px_30px_rgba(72,48,30,0.08)]">
                <div className="overflow-hidden">
                  <img src={item.image} alt={item.title} className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4 text-center">
                  <h3 className={`${playfair.className} text-xl text-[#3F2E23]`}>{item.title}</h3>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#8A6540] mt-1">Shop Now</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-4 pt-3 pb-10">
        <div data-reveal className="luxury-reveal rounded-[1.4rem] border border-[#DCC4A3] bg-gradient-to-r from-[#F7EBDD] to-[#FCF7EE] p-5 md:p-7 shadow-[0_14px_35px_rgba(76,52,30,0.08)]">
          <div className="grid lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-4 text-center lg:text-left">
              <h3 className={`${cormorant.className} text-3xl text-[#3A2A20]`}>Discover Jewellery That Tells Your Story</h3>
              <p className="text-[#5F4D3E] mt-1">Only at SAHA.AE</p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-[#5A4638]">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E1CCB0] bg-[#FFF9F0] p-3"><ShieldCheck className="w-4 h-4 text-[#AB7F49]" />Secure Shopping</div>
              <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E1CCB0] bg-[#FFF9F0] p-3"><Gem className="w-4 h-4 text-[#AB7F49]" />Quality Assured</div>
              <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E1CCB0] bg-[#FFF9F0] p-3"><Truck className="w-4 h-4 text-[#AB7F49]" />Worldwide Delivery</div>
            </div>

            <div className="lg:col-span-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7D5E3E] mb-2 text-center lg:text-left">Newsletter</p>
              <div className="flex rounded-xl overflow-hidden border border-[#D9BF9B] bg-white/70 backdrop-blur-sm">
                <input type="email" placeholder="Your email" className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none" />
                <button className="px-3 bg-[#C8A46B] text-white"><Mail className="w-4 h-4" /></button>
              </div>
              <div className="flex justify-center lg:justify-start gap-2 mt-3">
                {[Instagram, Linkedin, Globe].map((Icon, idx) => (
                  <button key={idx} className="w-9 h-9 rounded-full border border-[#C8A46B] text-[#A67B47] flex items-center justify-center hover:bg-[#C8A46B] hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .luxury-root {
          background-image: linear-gradient(180deg, #f8f4ee 0%, #fbf6f0 48%, #f8f4ee 100%);
        }

        .luxury-panel {
          border: 1px solid #ddc7a8;
          border-radius: 1.5rem;
          background: linear-gradient(145deg, rgba(255, 250, 242, 0.95), rgba(247, 236, 220, 0.93));
          box-shadow: 0 14px 35px rgba(70, 47, 29, 0.08);
        }

        .luxury-btn-primary {
          padding: 0.7rem 1.2rem;
          border-radius: 999px;
          font-size: 0.83rem;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          font-weight: 600;
          border: 1px solid #c8a46b;
          color: white;
          background: linear-gradient(135deg, #c8a46b, #b98d54);
          box-shadow: 0 10px 20px rgba(174, 129, 74, 0.28);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .luxury-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(174, 129, 74, 0.35);
        }

        .luxury-btn-secondary {
          padding: 0.7rem 1.2rem;
          border-radius: 999px;
          font-size: 0.83rem;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          font-weight: 600;
          border: 1px solid #d2b087;
          color: #6a4e33;
          background: rgba(255, 248, 238, 0.8);
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .luxury-btn-secondary:hover {
          background: #fff3e2;
          transform: translateY(-1px);
        }

        .luxury-card {
          border: 1px solid #e1caab;
          border-radius: 1rem;
          padding: 1rem;
          text-align: center;
          background: linear-gradient(180deg, #fffbf4, #fff6eb);
          box-shadow: 0 10px 24px rgba(77, 54, 32, 0.06);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .luxury-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(77, 54, 32, 0.12);
        }

        .luxury-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(200, 164, 107, 0.8) 0%, rgba(200, 164, 107, 0) 70%);
          animation: luxuryFloat 8s ease-in-out infinite;
        }

        .luxury-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .luxury-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes luxuryFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translate3d(0, -10px, 0) scale(1.2);
            opacity: 0.9;
          }
        }
      `}</style>
    </main>
  )
}
