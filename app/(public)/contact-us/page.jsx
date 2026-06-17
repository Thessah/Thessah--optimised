'use client';

import React, { useState } from 'react';

export default function ContactUs() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    // TODO: Send data to backend / API
    // Example:
    // fetch('/api/contact', { method: 'POST', body: JSON.stringify(form) });
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>

      {/* Success Message */}
      {submitted && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">
          Thank you for contacting us. Our team will get back to you shortly.
        </div>
      )}

      {/* Contact Form */}
      {!submitted && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-white p-6 rounded-xl shadow"
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter your name"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Message
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Write your message here..."
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600 transition"
          >
            Send Message
          </button>
        </form>
      )}

      {/* Business Contact Info */}
      <div className="mt-10 rounded-lg border bg-gray-50 p-6 text-sm text-gray-700">
        <p className="mb-2">
          <strong>Business Name:</strong> THESSAH Gold &amp; Jewellery
        </p>
        <p className="mb-2">
          <strong>Address:</strong> Hind Plaza 2, Shop No. 06, Gold Souq Extension, Al Ras, Deira, Dubai
        </p>
        <p className="mb-2">
          <strong>Website:</strong>{' '}
          <a
            href="https://www.thessah.ae"
            className="text-orange-600 hover:underline"
          >
            www.thessah.ae
          </a>
        </p>
        <p className="mb-2">
          <strong>Email:</strong>{' '}
          <a
            href="mailto:info@thessah.ae"
            className="text-orange-600 hover:underline"
          >
            info@thessah.ae
          </a>
        </p>
        <p className="mb-1">
          <strong>Customer Support:</strong>{' '}
          <a
            href="tel:+971588375912"
            className="text-orange-600 hover:underline"
          >
            +971 58 837 5912
          </a>{' '}
          /{' '}
          <a
            href="tel:+97142724515"
            className="text-orange-600 hover:underline"
          >
            +971 4 272 4515
          </a>
        </p>
      </div>
    </div>
  );
}

