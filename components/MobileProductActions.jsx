'use client'

import { Plus, ShoppingCart } from 'lucide-react'

export default function MobileProductActions({ 
  onOrderNow, 
  onAddToCart,
  onEnquiry,
  effPrice,
  currency,
  cartCount,
  showBuyButton = false,
  showEnquiryButton = false
}) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 safe-area-bottom">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Order Now Button - or Enquiry as fallback */}
        {showBuyButton ? (
          <button
            onClick={onOrderNow}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-red-500 rounded-lg font-bold text-white transition-all active:bg-red-600 shadow-md"
          >
            <span className="text-base">Order Now</span>
            <Plus size={20} strokeWidth={3} />
          </button>
        ) : showEnquiryButton && onEnquiry ? (
          <button
            onClick={onEnquiry}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-orange-500 rounded-lg font-bold text-white transition-all active:bg-orange-600 shadow-md"
          >
            <span className="text-base">Enquiry</span>
            <Plus size={20} strokeWidth={3} />
          </button>
        ) : null}

        {/* Add to Cart Button */}
        <button
          onClick={onAddToCart}
          className={`relative flex items-center justify-center h-12 bg-green-500 rounded-lg transition-all active:bg-green-600 shadow-md ${showBuyButton ? 'w-16' : 'flex-1'}`}
        >
          <ShoppingCart size={24} className="text-white" strokeWidth={2.5} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
