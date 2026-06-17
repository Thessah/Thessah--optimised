'use client'

import { MapPin, Phone, Clock, Navigation, Mail, Globe } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function FindStorePage() {
  const storeInfo = {
    name: "THESSAH",
    tagline: "Jewelry Store",
    address: "Hind Plaza 2, Shop No. 06, Gold Souq Extension, Al Ras, Deira, Dubai",
    plusCode: "77CW+HJ Dubai",
    phones: ["+971 58 837 5912", "+971 4 272 4515"],
    phone: "+971 58 837 5912",
    email: "info@thessah.ae",
    website: "www.thessah.ae",
    hours: {
      monday: "9:00 AM - 10:00 PM",
      tuesday: "9:00 AM - 10:00 PM",
      wednesday: "9:00 AM - 10:00 PM",
      thursday: "9:00 AM - 10:00 PM",
      friday: "2:00 PM - 10:00 PM",
      saturday: "9:00 AM - 10:00 PM",
      sunday: "9:00 AM - 10:00 PM"
    },
    image: "/store-front.jpg", // You can add your store image
    mapLink: "https://maps.app.goo.gl/mtzjezPxuYSxTHZu6"
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Store Image */}
      <div className="relative h-[400px] md:h-[500px] bg-gradient-to-r from-emerald-100 via-green-50 to-teal-100">
        <div className="absolute inset-0 bg-emerald-900/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl md:text-6xl font-serif text-emerald-900 mb-4">
            Visit Our Store
          </h1>
          <p className="text-xl md:text-2xl text-emerald-800 mb-8">
            Experience luxury jewelry in the heart of Dubai's Gold Souq
          </p>
          <a
            href={storeInfo.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Navigation className="w-5 h-5" />
            Get Directions
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Store Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Location Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-green-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                <p className="text-gray-600">{storeInfo.address}</p>
                <p className="text-sm text-gray-500 mt-2">{storeInfo.plusCode}</p>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-green-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <Phone className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact</h3>
                <div className="space-y-1">
                  {storeInfo.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="block text-emerald-600 hover:underline"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  <a
                    href={`mailto:${storeInfo.email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600"
                  >
                    <Mail className="w-4 h-4" />
                    {storeInfo.email}
                  </a>
                  <a
                    href={`https://${storeInfo.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600"
                  >
                    <Globe className="w-4 h-4" />
                    {storeInfo.website}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Hours Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-green-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Hours</h3>
                <p className="text-gray-600">Mon-Thu, Sat-Sun</p>
                <p className="text-sm text-gray-500">9:00 AM - 10:00 PM</p>
                <p className="text-sm text-gray-500 mt-1">Friday: 2:00 PM - 10:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-serif text-gray-900 mb-6 text-center">
            About THESSAH Jewelry
          </h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="mb-4">
              Welcome to THESSAH, Dubai's premier destination for exquisite jewelry. Located in the heart 
              of the historic Gold Souq at HIND Plaza, we bring you a curated collection of fine gold, 
              diamond, and precious gemstone jewelry.
            </p>
            <p className="mb-4">
              With decades of expertise in crafting and curating timeless pieces, THESSAH stands as a 
              symbol of quality, trust, and elegance. Our collection features:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                22K & 18K Gold Jewelry
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Certified Diamond Collections
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Bridal & Wedding Sets
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Custom Design Services
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Traditional & Contemporary Designs
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Precious Gemstone Jewelry
              </li>
            </ul>
            <p className="mb-4">
              Our experienced staff is dedicated to helping you find the perfect piece for every occasion, 
              whether it's an engagement ring, wedding jewelry, or a special gift. We pride ourselves on 
              offering competitive prices, authentic certifications, and exceptional customer service.
            </p>
            <p>
              Visit us today and experience the THESSAH difference. We look forward to welcoming you to 
              our showroom and helping you discover jewelry that tells your unique story.
            </p>
          </div>
        </div>

        {/* Google Maps */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-serif text-gray-900">Find Us on the Map</h2>
            <p className="text-gray-600 mt-2">
              Located in the prestigious Gold Souq area of Dubai
            </p>
          </div>
          <div className="w-full h-[450px] md:h-[600px]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.972842874779!2d55.294001677064!3d25.271498977663274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43000479b799%3A0xc2f8ac2507fb9b2b!2sTHESSAH!5e0!3m2!1sen!2sae!4v1769081436896!5m2!1sen!2sae" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl shadow-xl p-8 md:p-12 text-center border border-green-200">
          <h2 className="text-3xl md:text-4xl font-serif text-emerald-900 mb-4">
            Ready to Visit Us?
          </h2>
          <p className="text-xl text-emerald-700 mb-8 max-w-2xl mx-auto">
            Discover our exclusive collection and let our experts help you find the perfect piece
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={storeInfo.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-900 rounded-full font-semibold hover:bg-emerald-50 transition-all shadow-lg border-2 border-emerald-200"
            >
              <Navigation className="w-5 h-5" />
              Get Directions
            </a>
            <a
              href={`tel:${storeInfo.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-all border-2 border-emerald-600"
            >
              <Phone className="w-5 h-5" />
              Call Now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
