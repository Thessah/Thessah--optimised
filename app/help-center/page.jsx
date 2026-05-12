'use client'

import { MessageCircle, Phone, Mail, ChevronDown, Search } from 'lucide-react'
import { useState } from 'react'

export default function HelpCenter() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: 'How do I redeem Encircle Points?',
      answer: 'You can redeem your Encircle Points during checkout. Simply apply them to get instant discounts on your order. Points are earned with every purchase and can be tracked in your account dashboard.'
    },
    {
      question: 'Do I need to pay shipping / delivery charges?',
      answer: 'Free shipping is available on orders above AED 999. For orders below this amount, a nominal delivery charge of AED 99 applies. Express shipping options are also available at checkout.'
    },
    {
      question: 'Can I send gifts to my loved ones?',
      answer: 'Yes! You can send gifts to any address in India. During checkout, simply enter the recipient\'s address and add a personalized gift message. We\'ll package it beautifully for you.'
    },
    {
      question: 'What happens if my order is lost in transit?',
      answer: 'If your order is lost in transit, please contact our support team immediately. We will investigate with the courier partner and provide a full refund or replacement within 7-10 business days.'
    },
    {
      question: 'Questions on Cash On Delivery (COD)',
      answer: 'COD is available for orders up to AED 50,000. A nominal COD handling fee of AED 50 applies. Please keep exact change ready when the delivery executive arrives. COD is not available for international orders.'
    },
    {
      question: 'Questions on Tokenization',
      answer: 'Card tokenization keeps your payment information secure by replacing card details with unique tokens. Your actual card number is never stored on our servers. Tokens can be managed from your account settings.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Help & Contact</h1>
          <p className="text-slate-600 text-lg">Have A Question</p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Chat with Us</h3>
            <p className="text-slate-600 text-sm">Reach us on WhatsApp or live chat</p>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 text-center hover:border-green-400 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Call Us At</h3>
            <p className="text-slate-600 text-sm font-medium">1800-266-0123</p>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 text-center hover:border-purple-400 hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Write to Us</h3>
            <p className="text-slate-600 text-sm">support@se</p>
          </div>
        </div>

        {/* Note */}
        <p className="text-center text-slate-500 text-sm mb-12">
          The toll-free number applies to domestic orders within India. For international customers or deliveries please reach us via WhatsApp, Live chat or email.
        </p>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Top Customer Questions</h2>
            <button className="text-blue-600 font-medium hover:underline text-sm">ALL FAQ'S</button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-slate-800 font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                    <div className="pt-3">{faq.answer}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
