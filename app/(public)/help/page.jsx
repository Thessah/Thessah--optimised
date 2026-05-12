"use client"

import { useState } from 'react'
import Link from 'next/link'

const faqs = [
  { q: 'How do I redeem Encircle Points?', a: 'Log in to your account, proceed to checkout, and apply your Encircle points in the payments section. Points can be combined with select offers as per terms.' },
  { q: 'Do I need to pay shipping / delivery charges?', a: 'Shipping is free on qualified orders. Otherwise, a nominal fee may apply based on location and order value. Final shipping fees are shown at checkout.' },
  { q: 'Can I send gifts to my loved ones?', a: 'Yes. Add the recipient address during checkout and include a gift message. We do not include pricing in the package for gift orders.' },
  { q: 'What happens if my order is lost in transit?', a: 'If your order is lost in transit, contact support with your order number. We will investigate with the courier and either reship or refund as per policy.' },
  { q: 'Questions on Cash On Delivery (COD)', a: 'COD is available in select pin codes and for eligible order amounts. Please keep exact cash ready at delivery.' },
  { q: 'Questions on Tokenization', a: 'Card tokenization securely stores a token instead of your full card number. It improves security and speeds up checkout for future orders.' },
]

export default function HelpContactPage() {
  const [open, setOpen] = useState(null)

  return (
    <section className="min-h-[70vh] bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Help & Contact</h1>
          <p className="mt-2 text-slate-600">Have A Question</p>
        </div>

        {/* Contact tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mb-8">
          <div className="border rounded-xl p-6 hover:shadow-md transition">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#008C6D]/10 flex items-center justify-center mb-3">
              <span className="text-[#008C6D] text-xl">💬</span>
            </div>
            <h3 className="font-semibold text-slate-900">Chat with Us</h3>
            <p className="text-sm text-slate-600 mt-1">Reach us on WhatsApp or live chat</p>
          </div>
          <div className="border rounded-xl p-6 hover:shadow-md transition">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#008C6D]/10 flex items-center justify-center mb-3">
              <span className="text-[#008C6D] text-xl">📞</span>
            </div>
            <h3 className="font-semibold text-slate-900">Call Us At</h3>
            <p className="text-sm text-slate-600 mt-1">1800-266-0123</p>
          </div>
          <div className="border rounded-xl p-6 hover:shadow-md transition">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#008C6D]/10 flex items-center justify-center mb-3">
              <span className="text-[#008C6D] text-xl">✉️</span>
            </div>
            <h3 className="font-semibold text-slate-900">Write to Us</h3>
            <p className="text-sm text-slate-600 mt-1">support@Thessah.ae</p>
          </div>
        </div>
        <p className="text-center text-xs text-slate-500 mb-12">The toll-free number applies to domestic orders within India. For international customers or deliveries please reach us via WhatsApp, Live chat or email.</p>

        {/* Top Customer Questions header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Top Customer Questions</h2>
          <Link href="/help/faqs" className="text-sm font-medium text-[#008C6D] hover:underline">ALL FAQ'S</Link>
        </div>

        {/* FAQ list */}
        <div className="divide-y border rounded-xl">
          {faqs.map((item, idx) => (
            <button
              key={idx}
              className="w-full text-left p-4 flex items-start justify-between gap-4 hover:bg-slate-50"
              onClick={() => setOpen(open === idx ? null : idx)}
            >
              <span className="text-slate-800 text-sm sm:text-base">{item.q}</span>
              <span className="text-[#008C6D]">{open === idx ? '−' : '+'}</span>
            </button>
          ))}
        </div>

        {/* Answers */}
        <div className="mt-2">
          {faqs.map((item, idx) => (
            <div key={`a-${idx}`} className={`${open === idx ? 'block' : 'hidden'} bg-white border border-slate-200 rounded-xl p-4 mt-2`}> 
              <p className="text-slate-700 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
