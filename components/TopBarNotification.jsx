

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

const TopBarNotification = () => {
  const [visible, setVisible] = useState(false)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    fetch('/api/store/settings')
      .then((r) => r.json())
      .then((data) => {
        const tb = data?.settings?.topBar
        if (tb?.enabled && tb?.text) {
          setConfig(tb)
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!visible || !config) return null

  return (
    <div className="relative flex items-center justify-center py-3 px-6 bg-white border border-yellow-300 rounded-xl shadow-lg mx-2 mt-3 mb-2">
      <span className="mr-3 text-2xl text-yellow-500 drop-shadow">💎</span>
      <span className="font-serif font-semibold text-sm md:text-base text-yellow-800 text-center flex-1">
        {config.text}
      </span>
      {config.buttonText && config.buttonPath && (
        <Link
          href={config.buttonPath}
          className="ml-4 bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1 px-4 rounded-full shadow transition-all text-xs md:text-sm whitespace-nowrap"
        >
          {config.buttonText}
        </Link>
      )}
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
