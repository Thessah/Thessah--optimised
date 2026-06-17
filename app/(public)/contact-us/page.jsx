'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Globe, Clock, Send, CheckCircle2 } from 'lucide-react';

const BRAND = '#008C6D';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // TODO: Send data to backend / API
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#008C6D]/40 focus:border-[#008C6D] transition';

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#00644E] via-[#008C6D] to-[#00A37F]">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center text-white">
          <span className="inline-block text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-white/80 mb-3">
            We&apos;re here to help
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold mb-4">Get in Touch</h1>
          <p className="max-w-2xl mx-auto text-white/90 text-base sm:text-lg">
            Have a question about our jewellery, gold rates, or an order? Reach out and our
            THESSAH team will be delighted to assist you.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact info panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-white shadow-lg border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-[#008C6D]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#008C6D]" />
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">Call us</p>
                    <a href="tel:+971588375912" className="block font-medium text-gray-900 hover:text-[#008C6D]">
                      +971 58 837 5912
                    </a>
                    <a href="tel:+97142724515" className="block font-medium text-gray-900 hover:text-[#008C6D]">
                      +971 4 272 4515
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-[#008C6D]/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#008C6D]" />
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a href="mailto:info@thessah.ae" className="font-medium text-gray-900 hover:text-[#008C6D]">
                      info@thessah.ae
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-[#008C6D]/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[#008C6D]" />
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a
                      href="https://www.thessah.ae"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-[#008C6D]"
                    >
                      www.thessah.ae
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-[#008C6D]/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#008C6D]" />
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">Visit us</p>
                    <p className="font-medium text-gray-900">
                      Hind Plaza 2, Shop No. 06, Gold Souq Extension, Al Ras, Deira, Dubai
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-[#008C6D]/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#008C6D]" />
                  </span>
                  <div>
                    <p className="text-sm text-gray-500">Working hours</p>
                    <p className="font-medium text-gray-900">Mon - Sun: 10:00 AM - 10:00 PM</p>
                  </div>
                </li>
              </ul>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href="tel:+971588375912"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#008C6D] px-4 py-2.5 font-semibold text-white hover:bg-[#00745A] transition"
                >
                  <Phone className="w-4 h-4" /> Call Now
                </a>
                <a
                  href="https://maps.app.goo.gl/mtzjezPxuYSxTHZu6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[#008C6D] px-4 py-2.5 font-semibold text-[#008C6D] hover:bg-[#008C6D]/5 transition"
                >
                  <MapPin className="w-4 h-4" /> Directions
                </a>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-white shadow-lg border border-gray-100 p-6 sm:p-8 h-full">
              {submitted ? (
                <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-16 h-16 text-[#008C6D] mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 max-w-md">
                    Thank you for contacting THESSAH. Our team will get back to you shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: '', email: '', phone: '', message: '' });
                    }}
                    className="mt-6 inline-flex items-center gap-2 rounded-lg border-2 border-[#008C6D] px-5 py-2.5 font-semibold text-[#008C6D] hover:bg-[#008C6D]/5 transition"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Send us a message</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Fill out the form below and we&apos;ll respond as soon as possible.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Enter your name"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="Enter your phone"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Write your message here..."
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#008C6D] px-7 py-3 font-semibold text-white hover:bg-[#00745A] transition shadow-sm"
                    >
                      <Send className="w-4 h-4" /> Send Message
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-10 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.972842874779!2d55.294001677064!3d25.271498977663274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43000479b799%3A0xc2f8ac2507fb9b2b!2sTHESSAH!5e0!3m2!1sen!2sae!4v1769081436896!5m2!1sen!2sae"
            width="100%"
            height="360"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="THESSAH location map"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
