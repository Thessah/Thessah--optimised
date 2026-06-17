"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { CalendarCheck, Gem, ShieldCheck, Clock, MapPin, Phone } from 'lucide-react'
import LeftImage from '@/assets/cont.webp'

export default function BookAppointmentPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', time: '', type: 'In-store', store: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) 
  const [stores, setStores] = useState([])
  const [useCustomStore, setUseCustomStore] = useState(false)

  useEffect(() => {
    const loadStores = async () => {
      try {
        const { data } = await axios.get('/api/stores')
        setStores(Array.isArray(data.stores) ? data.stores : [])
      } catch {}
    }
    loadStores()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const validate = () => {
    const emailOk = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(form.email)
    const phoneOk = /^[0-9+\-()\s]{7,}$/i.test(form.phone)
    const dateOk = !!form.date
    const timeOk = !!form.time
    if (!(form.name.trim().length >= 2 && emailOk && phoneOk && dateOk && timeOk)) return false
    // Slot rules: future date, Mon-Sat, 10:00-19:00
    try {
      const d = new Date(form.date + 'T' + (form.time || '00:00'))
      const now = new Date()
      // Must be today or later
      if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return false
      const day = d.getDay() // 0 Sun
      if (day === 0) return false
      const [hh, mm] = (form.time || '00:00').split(':').map(n => parseInt(n, 10))
      const minutes = hh * 60 + (mm || 0)
      const start = 10 * 60
      const end = 19 * 60
      if (minutes < start || minutes > end) return false
    } catch { return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    if (!validate()) {
      setStatus({ type: 'error', message: 'Please fill valid name, email and phone.' })
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/appointment', form)
      setStatus({ type: 'success', message: 'Appointment request sent. We will contact you shortly.' })
      setForm({ name: '', email: '', phone: '', date: '', time: '', type: 'In-store', store: '', message: '' })
    } catch (err) {
      setStatus({ type: 'error', message: err?.response?.data?.error || 'Failed to submit. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-[70vh] bg-gradient-to-b from-gray-50 to-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-xl bg-white">
          {/* Left visual */}
          <div className="relative hidden md:block">
            <Image src={LeftImage} alt="Book an appointment" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-[#008C6D]/60 mix-blend-multiply" />
            <div className="absolute inset-0 p-8 text-white flex items-end">
              <div>
                <h2 className="text-3xl font-bold">Book an Appointment</h2>
                <p className="mt-2 text-white/90">Personalized assistance for your next purchase.</p>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#008C6D]/10 flex items-center justify-center">
                <span className="text-[#008C6D] font-bold">📅</span>
              </div>
              <h3 className="text-2xl font-bold mt-3">Schedule Your Visit</h3>
              <p className="text-sm text-gray-600">Share your details and our team will confirm.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="name"
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                required
              />
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  name="date"
                  type="date"
                  placeholder="Preferred Date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                  required
                />
                <input
                  name="time"
                  type="time"
                  placeholder="Preferred Time"
                  value={form.time}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                >
                  <option>In-store</option>
                  <option>Video consultation</option>
                </select>
                {stores.length > 0 && !useCustomStore ? (
                  <select
                    name="store"
                    value={form.store}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === '__other__') {
                        setUseCustomStore(true)
                        setForm(f => ({ ...f, store: '' }))
                      } else {
                        handleChange(e)
                      }
                    }}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                  >
                    <option value="">Select Store</option>
                    {stores.map(s => (
                      <option key={s.id} value={`${s.name}${s.city ? ' - ' + s.city : ''}`}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
                    ))}
                    <option value="__other__">Other…</option>
                  </select>
                ) : (
                  <input
                    name="store"
                    type="text"
                    placeholder="Preferred Store / City"
                    value={form.store}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
                  />
                )}
              </div>
              <textarea
                name="message"
                placeholder="Tell us what this is about (optional)"
                value={form.message}
                onChange={handleChange}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008C6D]"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#008C6D] hover:bg-[#00745A] text-white font-semibold py-2.5 rounded-lg transition"
              >
                {loading ? 'Submitting…' : 'Book Appointment'}
              </button>
            </form>

            {status && (
              <div className={`mt-3 text-sm text-center ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {status.message}
              </div>
            )}

            <p className="text-xs text-gray-500 text-center mt-4">
              By submitting, you agree to our <a href="/terms" className="underline">Terms of Use</a> and <a href="/privacy-policy" className="underline">Privacy Policy</a>.
            </p>
          </div>
        </div>

        {/* Why book an appointment */}
        <div className="mt-14">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-[#008C6D] mb-2">
              The THESSAH Experience
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Why Book an Appointment?</h2>
            <p className="mt-3 text-gray-600">
              Enjoy a private, personalised visit with our jewellery experts — no waiting, full
              attention, and curated pieces selected just for you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CalendarCheck,
                title: 'Personalised Consultation',
                desc: 'One-on-one guidance tailored to your style, occasion, and budget.',
              },
              {
                icon: Gem,
                title: 'Exclusive Collections',
                desc: 'Preview the latest gold and diamond pieces before anyone else.',
              },
              {
                icon: ShieldCheck,
                title: 'Certified & Trusted',
                desc: 'Authentic, hallmarked jewellery with transparent gold rates.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition p-6 text-center"
              >
                <div className="mx-auto w-14 h-14 rounded-2xl bg-[#008C6D]/10 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-[#008C6D]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Visit / contact strip */}
        <div className="mt-10 rounded-2xl overflow-hidden bg-gradient-to-r from-[#00644E] via-[#008C6D] to-[#00A37F] text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 sm:p-10">
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 shrink-0 mt-1" />
              <div>
                <p className="text-white/80 text-sm">Visit our showroom</p>
                <p className="font-medium">Hind Plaza 2, Shop No. 06, Gold Souq Extension, Al Ras, Deira, Dubai</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-6 h-6 shrink-0 mt-1" />
              <div>
                <p className="text-white/80 text-sm">Call to confirm</p>
                <a href="tel:+971588375912" className="block font-medium hover:underline">+971 58 837 5912</a>
                <a href="tel:+97142724515" className="block font-medium hover:underline">+971 4 272 4515</a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 shrink-0 mt-1" />
              <div>
                <p className="text-white/80 text-sm">Working hours</p>
                <p className="font-medium">Mon - Sun: 10:00 AM - 10:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
