

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'


const TopBarNotification = () => {
  const [visible, setVisible] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user)
    })
    return () => unsubscribe()
  }, [])

  if (!visible || isLoggedIn) return null

  return (
    <div className="relative flex items-center justify-center py-3 px-6 bg-white border border-yellow-300 rounded-xl shadow-lg mx-2 mt-3 mb-2">
      <span className="mr-3 text-2xl text-yellow-500 drop-shadow">💎</span>
      <span className="font-serif font-semibold text-base md:text-lg text-yellow-800 text-center">
        <span className="hidden sm:inline">Exclusive Welcome Offer:</span>
        <span className="sm:hidden">Welcome Offer:</span>
        {' '}
        <span className="text-yellow-600 font-bold">AED 199 OFF</span> your first jewelry order
        <span className="hidden sm:inline"> &amp; Free Shipping</span>.
      </span>
      <button
        className="ml-4 bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1 px-4 rounded-full shadow transition-all text-xs md:text-sm"
        style={{ boxShadow: '0 2px 8px 0 rgba(255, 215, 0, 0.15)' }}
        onClick={() => alert('Shop Now!')}
      >
        Shop Now
      </button>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-600 transition p-1"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  )
}

export default TopBarNotification
