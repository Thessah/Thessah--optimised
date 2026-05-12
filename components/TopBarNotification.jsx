
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

const TopBarNotification = () => {
  const [visible, setVisible] = useState(true) // Start as true for immediate rendering
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

  // Auto-close after 30 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 30000);
    return () => clearTimeout(timer);
  }, [visible]);


  if (!config || !visible) return null

  return (
    <div className="w-full bg-gradient-to-r from-yellow-50 to-yellow-100 border-b-2 border-yellow-400 px-2 sm:px-4 py-2 sm:py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Icon + Text */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          {config.icon && (
            <span className="text-base sm:text-xl text-yellow-500 flex-shrink-0">
              {config.icon}
            </span>
          )}
          <span className="font-semibold text-xs sm:text-sm text-amber-900 break-words">
            {config.text}
          </span>
        </div>

        {/* Right: Button & Close */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {config.buttonText && config.buttonPath && (
            <Link
              href={config.buttonPath}
              className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1 px-2.5 sm:px-4 rounded-full shadow transition-all text-xs sm:text-sm whitespace-nowrap"
            >
              {config.buttonText}
            </Link>
          )}
          
          <button
            onClick={() => setVisible(false)}
            className="text-yellow-600 hover:text-yellow-700 transition p-0.5 flex-shrink-0"
            aria-label="Close notification"
          >
            <X size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopBarNotification
