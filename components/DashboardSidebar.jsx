'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/useAuth'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function DashboardSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [buyNowGlobalEnabled, setBuyNowGlobalEnabled] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await axios.get('/api/store/settings')
        setBuyNowGlobalEnabled(data?.settings?.buyNowGlobalEnabled !== false)
      } catch {
        setBuyNowGlobalEnabled(true)
      }
    }
    loadSettings()
  }, [])

  const handleLogout = async () => {
    if (user) {
      await signOut(auth)
      window.location.href = '/'
    }
  }

  const menuItems = [
    { label: 'Profile', href: '/dashboard/profile' },
    { label: buyNowGlobalEnabled ? 'Orders' : 'Enquiries', href: '/dashboard/orders' },
    { label: 'Wishlist', href: '/dashboard/wishlist' },
    { label: 'Browse History', href: '/browse-history' },
    { label: 'Addresses', href: '/dashboard/profile#addresses' },
    { label: 'Account Settings', href: '/settings' },
    { label: 'Help & Support', href: '/help' },
  ]

  const isActive = (href) => {
    if (href.includes('#')) {
      return pathname === href.split('#')[0]
    }
    return pathname === href
  }

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="md:hidden -mt-2 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Dashboard</h2>
          <details className="relative">
            <summary className="list-none cursor-pointer px-3 py-2 rounded-lg border border-slate-200 text-slate-700">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-md p-2 z-10">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-lg hover:bg-gray-100 font-medium ${
                    isActive(item.href)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block md:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm p-4 h-fit flex flex-col">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Dashboard</h2>
          <nav className="flex flex-col gap-1 text-sm">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg hover:bg-gray-100 font-medium ${
                  isActive(item.href)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 text-xs text-slate-500">
            Manage your account and preferences.
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-auto pt-4 border-t border-slate-200 w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm"
        >
          Logout
        </button>
      </aside>
    </>
  )
}
