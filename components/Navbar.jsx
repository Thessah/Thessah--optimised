"use client";


"use client";

import { Search, ShoppingCart, LifeBuoy, Menu, X, HeartIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { auth } from '../lib/firebase';
import { getAuth } from "firebase/auth";
console.log("Firebase UID:", getAuth().currentUser?.uid);
import Image from 'next/image';
import axios from "axios";
import toast from "react-hot-toast";
import Logo from "../assets/logo/logo.png";
import Truck from '../assets/delivery.png';
import SignInModal from './SignInModal';

const Navbar = () => {
  // State for image search modal
  const [showImageSearch, setShowImageSearch] = useState(false);

  // Helper function for image search
  const handleImageSearch = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/search-by-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      let keyword = data.keyword || (Array.isArray(data.keywords) ? data.keywords[0] : '');
      if (keyword) {
        window.location.href = `/shop?search=${encodeURIComponent(keyword)}`;
      } else {
        alert('No matching product found.');
      }
    } catch (err) {
      alert('Image search failed.');
    }
  };

  // State for categories
  const [categories, setCategories] = useState([]);
  // State for navigation menu items
  const [navMenuItems, setNavMenuItems] = useState([]);
  const [navMenuEnabled, setNavMenuEnabled] = useState(true);
  const [navActionsVisibility, setNavActionsVisibility] = useState({
    store: true,
    wishlist: true,
    cart: true
  });
  // State for animated search placeholder
  const [searchPlaceholder, setSearchPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [productIndex, setProductIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const hoverTimer = useRef(null);
  const categoryTimer = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const cartCount = useSelector((state) => state.cart.total);
  const [signInOpen, setSignInOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const userDropdownRef = useRef(null);

  // Show sign-in modal automatically on mobile for guest users
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && !firebaseUser) {
      setSignInOpen(true);
    }
  }, [firebaseUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  // (already declared above)

  // Perf: cache categories + menu in sessionStorage and revalidate in background
  useEffect(() => {
    const CAT_KEY = 'nav:categories:v1'
    const MENU_KEY = 'nav:menu:v1'
    const MENU_ENABLED_KEY = 'nav:menu:enabled:v1'
    const ACTIONS_VISIBILITY_KEY = 'nav:actions:visibility:v1'
    const TTL = 10 * 60 * 1000 // 10 minutes

    // 1) Seed from cache immediately
    try {
      const rawCats = sessionStorage.getItem(CAT_KEY)
      if (rawCats) {
        const cached = JSON.parse(rawCats)
        if (cached && Array.isArray(cached.data) && (Date.now() - cached.ts < TTL)) {
          setCategories(cached.data)
        }
      }
      const rawMenu = sessionStorage.getItem(MENU_KEY)
      if (rawMenu) {
        const cached = JSON.parse(rawMenu)
        if (cached && Array.isArray(cached.data) && (Date.now() - cached.ts < TTL)) {
          setNavMenuItems(cached.data)
        }
      }

      const rawMenuEnabled = sessionStorage.getItem(MENU_ENABLED_KEY)
      if (rawMenuEnabled) {
        const cached = JSON.parse(rawMenuEnabled)
        if (typeof cached?.data === 'boolean' && (Date.now() - cached.ts < TTL)) {
          setNavMenuEnabled(cached.data)
        }
      }

      const rawActionsVisibility = sessionStorage.getItem(ACTIONS_VISIBILITY_KEY)
      if (rawActionsVisibility) {
        const cached = JSON.parse(rawActionsVisibility)
        const data = cached?.data
        if (data && typeof data === 'object' && (Date.now() - cached.ts < TTL)) {
          setNavActionsVisibility({
            store: data.store !== false,
            wishlist: data.wishlist !== false,
            cart: data.cart !== false
          })
        }
      }
    } catch {}

    // 2) Revalidate both endpoints in parallel with timeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)

    const revalidate = async () => {
      try {
        const [catRes, settingsRes] = await Promise.all([
          fetch('/api/categories', { cache: 'no-store', signal: controller.signal }),
          fetch('/api/store/settings', { cache: 'no-store', signal: controller.signal })
        ])
        if (catRes.ok) {
          const catData = await catRes.json()
          if (Array.isArray(catData?.categories)) {
            setCategories(catData.categories)
            try { sessionStorage.setItem(CAT_KEY, JSON.stringify({ ts: Date.now(), data: catData.categories })) } catch {}
          }
        }
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          const items = settingsData?.settings?.navMenuItems
          const enabled = settingsData?.settings?.navMenuEnabled
          const actionsVisibility = settingsData?.settings?.navActionsVisibility
          if (Array.isArray(items)) {
            setNavMenuItems(items)
            try { sessionStorage.setItem(MENU_KEY, JSON.stringify({ ts: Date.now(), data: items })) } catch {}
          }
          if (typeof enabled === 'boolean') {
            setNavMenuEnabled(enabled)
            try { sessionStorage.setItem(MENU_ENABLED_KEY, JSON.stringify({ ts: Date.now(), data: enabled })) } catch {}
          }
          if (actionsVisibility && typeof actionsVisibility === 'object') {
            const normalized = {
              store: actionsVisibility.store !== false,
              wishlist: actionsVisibility.wishlist !== false,
              cart: actionsVisibility.cart !== false
            }
            setNavActionsVisibility(normalized)
            try { sessionStorage.setItem(ACTIONS_VISIBILITY_KEY, JSON.stringify({ ts: Date.now(), data: normalized })) } catch {}
          }
        }
      } catch (err) {
        if (err?.name !== 'AbortError') console.error('Navbar fetch error:', err)
      } finally {
        clearTimeout(timer)
      }
    }

    revalidate()

    // Optional gentle refresh every 10 minutes
    const interval = setInterval(revalidate, TTL)
    return () => { clearInterval(interval); controller.abort(); clearTimeout(timer) }
  }, [])

  // Instant menu refresh after dashboard updates nav items/icons.
  useEffect(() => {
    const MENU_KEY = 'nav:menu:v1'
    const MENU_ENABLED_KEY = 'nav:menu:enabled:v1'
    const ACTIONS_VISIBILITY_KEY = 'nav:actions:visibility:v1'

    const syncNavMenu = async () => {
      try {
        const settingsRes = await fetch('/api/store/settings', { cache: 'no-store' })
        if (!settingsRes.ok) return

        const settingsData = await settingsRes.json()
        const items = settingsData?.settings?.navMenuItems
        const enabled = settingsData?.settings?.navMenuEnabled
        const actionsVisibility = settingsData?.settings?.navActionsVisibility
        if (Array.isArray(items)) {
          setNavMenuItems(items)
          try { sessionStorage.setItem(MENU_KEY, JSON.stringify({ ts: Date.now(), data: items })) } catch {}
        }
        if (typeof enabled === 'boolean') {
          setNavMenuEnabled(enabled)
          try { sessionStorage.setItem(MENU_ENABLED_KEY, JSON.stringify({ ts: Date.now(), data: enabled })) } catch {}
        }
        if (actionsVisibility && typeof actionsVisibility === 'object') {
          const normalized = {
            store: actionsVisibility.store !== false,
            wishlist: actionsVisibility.wishlist !== false,
            cart: actionsVisibility.cart !== false
          }
          setNavActionsVisibility(normalized)
          try { sessionStorage.setItem(ACTIONS_VISIBILITY_KEY, JSON.stringify({ ts: Date.now(), data: normalized })) } catch {}
        }
      } catch (err) {
        console.error('Navbar instant sync error:', err)
      }
    }

    window.addEventListener('navMenuUpdated', syncNavMenu)
    return () => window.removeEventListener('navMenuUpdated', syncNavMenu)
  }, [])

  // Product names for animated placeholder
  const productNames = [
    "Gold Necklace",
    "Diamond Ring",
    "Pearl Earrings",
    "Bridal Set",
    "Gold Bangles",
    "Silver Anklet",
    "Gemstone Pendant",
    "Wedding Rings",
    "Platinum Chain",
    "Temple Jewellery"
  ];

  // Typewriter effect for search placeholder
  useEffect(() => {
    const currentProduct = productNames[productIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (searchPlaceholder.length < currentProduct.length) {
          setSearchPlaceholder(currentProduct.substring(0, searchPlaceholder.length + 1));
        } else {
          // Wait before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (searchPlaceholder.length > 0) {
          setSearchPlaceholder(searchPlaceholder.substring(0, searchPlaceholder.length - 1));
        } else {
          // Move to next product
          setIsDeleting(false);
          setProductIndex((prev) => (prev + 1) % productNames.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [searchPlaceholder, isDeleting, productIndex, productNames]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      console.log("Navbar user:", user);
    });
    return () => unsubscribe();
  }, []);

  // Listen for custom event to open sign in modal
  useEffect(() => {
    const handleOpenSignInModal = () => {
      setSignInOpen(true);
    };
    window.addEventListener('openSignInModal', handleOpenSignInModal);
    return () => window.removeEventListener('openSignInModal', handleOpenSignInModal);
  }, []);

  useEffect(() => {
    const fetchIfLoggedIn = () => {
      if (auth.currentUser) {
        fetchWishlistCount();
      } else {
        // Get guest wishlist count from localStorage
        try {
          const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
          setWishlistCount(Array.isArray(guestWishlist) ? guestWishlist.length : 0);
        } catch {
          setWishlistCount(0);
        }
      }
    };
    fetchIfLoggedIn();
    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      fetchIfLoggedIn();
    };
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);

  const fetchWishlistCount = async () => {
    try {
      if (!auth.currentUser) {
        // Get guest wishlist count from localStorage
        try {
          const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
          setWishlistCount(Array.isArray(guestWishlist) ? guestWishlist.length : 0);
        } catch {
          setWishlistCount(0);
        }
        return;
      }
      const token = await auth.currentUser.getIdToken();
      const { data } = await axios.get('/api/wishlist', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWishlistCount(data.wishlist?.length || 0);
    } catch (error) {
      // Silently handle auth errors (expected when not logged in)
      if (error.response?.status === 401) {
        // Try to get guest wishlist as fallback
        try {
          const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
          setWishlistCount(Array.isArray(guestWishlist) ? guestWishlist.length : 0);
        } catch {
          setWishlistCount(0);
        }
      } else {
        console.error('Error fetching wishlist count:', error);
        setWishlistCount(0);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/shop?search=${search}`);
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!cartCount || cartCount === 0) {
      toast((t) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Your cart is empty!</p>
            <p className="text-sm text-gray-600 mt-0.5">Start shopping to add items to your cart</p>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              router.push('/shop');
            }}
            className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition font-medium"
          >
            Shop Now
          </button>
        </div>
      ), {
        duration: 4000,
        style: {
          padding: '16px',
          maxWidth: '500px',
        },
      });
      return;
    }
    router.push("/cart");
  };
  

  // Seller approval check (fetch from backend) - Only check, don't show toast
  const [isSeller, setIsSeller] = useState(false);
  const [isSellerLoading, setIsSellerLoading] = useState(false);
  const lastCheckedUidRef = useRef(null);
  useEffect(() => {
    const uid = firebaseUser?.uid || null;
    if (!uid) {
      setIsSeller(false);
      setIsSellerLoading(false);
      lastCheckedUidRef.current = null;
      return;
    }
    if (lastCheckedUidRef.current === uid) {
      // Already checked for this UID; no need to re-call API
      return;
    }
    lastCheckedUidRef.current = uid;
    const checkSeller = async () => {
      setIsSellerLoading(true);
      try {
        const token = await firebaseUser.getIdToken(true);
        const { data } = await axios.get('/api/store/is-seller', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsSeller(!!data.isSeller);
        setIsSellerLoading(false);
      } catch (err) {
        try {
          const token2 = await firebaseUser.getIdToken(true);
          const { data } = await axios.get('/api/store/is-seller', {
            headers: { Authorization: `Bearer ${token2}` },
          });
          setIsSeller(!!data.isSeller);
          setIsSellerLoading(false);
        } catch {
          setIsSeller(false);
          setIsSellerLoading(false);
        }
      }
    };
    checkSeller();
  }, [firebaseUser?.uid]);

  return (
    <>
      {/* Mobile-Only Simple Navbar for Non-Home Pages */}
      {!isHomePage && (
        <nav className="lg:hidden sticky top-0 z-50 shadow-sm" style={{ backgroundColor: '#2874f0' }}>
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Back Button */}
            <button 
              onClick={() => router.back()} 
              className="p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-100">
                <Search size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder-gray-400 text-gray-700 text-sm"
                />
              </div>
            </form>

            {/* Cart Icon */}
            <button onClick={handleCartClick} className="relative p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0">
              <ShoppingCart size={20} className="text-gray-700" />
              {isClient && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold text-white bg-blue-600 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      )}

      {/* Original Full Navbar (Hidden on mobile for non-home pages) */}
      <nav className={`relative z-50 shadow-md ${!isHomePage ? 'hidden lg:block' : ''}`} style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Bar with Logo, Search and Icons */}
        <div className="flex items-center justify-between py-4 gap-6">

          {/* Left Side - Hamburger (Mobile) + Logo */}
          <div className="flex items-center gap-2">
            {/* Hamburger Menu - Mobile Only on Home Page */}
            {isHomePage && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition"
              >
                {mobileMenuOpen ? <X size={24} className="text-gray-700" /> : <Menu size={24} className="text-gray-700" />}
              </button>
            )}
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image src={Logo} alt="Qui Logo" width={180} height={48} className="object-contain" priority />
            </Link>
          </div>

          {/* Center - Search Bar */}
          <div className="hidden lg:flex items-center flex-1 justify-center px-8 max-w-3xl">
            {/* Search Bar - Thessah Style */}
            <form onSubmit={handleSearch} className="flex items-center w-full gap-3 rounded-xl border border-gray-200 bg-white px-5 py-2.5 shadow-sm transition-all hover:border-gray-300 focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-100">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder={searchPlaceholder || "Search for engagement rings"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none placeholder-gray-400 text-gray-700 text-[15px] font-normal"
              />
            </form>
            {/* Image Search Modal (Desktop only) */}
            {typeof window !== 'undefined' && window.innerWidth >= 768 && showImageSearch && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative animate-slideUp">
                  <button
                    onClick={() => setShowImageSearch(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h2 className="text-lg font-bold mb-2">Search by image</h2>
                  <p className="text-sm text-gray-500 mb-4">Find what you love with better prices by using an image search.</p>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-8 px-4 mb-4 cursor-pointer"
                    onDrop={async (e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) await handleImageSearch(file);
                    }}
                    onDragOver={e => e.preventDefault()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 mb-2">
                      <rect x="4" y="4" width="16" height="16" rx="2" fill="#f3f4f6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16l4-4 4 4" />
                      <circle cx="9" cy="9" r="2" />
                    </svg>
                    <span className="text-gray-500 mb-2">Drag an image here</span>
                    <span className="text-gray-400 text-xs mb-2">or</span>
                    <label htmlFor="image-search-upload-modal" className="inline-block">
                      <input
                        id="image-search-upload-modal"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) await handleImageSearch(file);
                        }}
                      />
                      <span className="bg-red-600 text-white px-6 py-2 rounded-full font-bold cursor-pointer">Upload a photo</span>
                    </label>
                    <span className="text-gray-400 text-xs mt-2">*For a quick search hit CTRL+V to paste an image into the search box</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Actions */}
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
            {/* Store Locator */}
            {navActionsVisibility.store && (
            <Link href="/find-store" className="flex flex-col items-center gap-0.5 hover:text-red-600 transition text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-xs font-medium">Store</span>
            </Link>
            )}

            {/* Wishlist */}
            {navActionsVisibility.wishlist && (
            <Link href={firebaseUser ? "/dashboard/wishlist" : "/wishlist"} className="relative flex flex-col items-center gap-0.5 hover:text-red-600 transition text-gray-600">
              <HeartIcon size={20} className="transition" />
              <span className="text-xs font-medium">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {wishlistCount}
                </span>
              )}
            </Link>
            )}

            {/* Cart */}
            {navActionsVisibility.cart && (
            <button onClick={handleCartClick} className="relative flex flex-col items-center gap-0.5 hover:text-red-600 transition text-gray-600">
              <ShoppingCart size={20} className="transition" />
              <span className="text-xs font-medium">Cart</span>
              {isClient && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </button>
            )}

            {/* Store Dashboard Badge - Shows if user is a seller */}
            {isSeller && (
              <Link
                href="/store"
                className="flex flex-col items-center gap-0.5 hover:text-red-600 transition text-gray-600 relative"
              >
                <div className="w-6 h-6 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-[10px]">
                  DB
                </div>
                <span className="text-xs font-medium">Store</span>
              </Link>
            )}

            {/* Login/User Button */}
            {firebaseUser ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-red-600 transition text-gray-600"
                >
                  {firebaseUser.photoURL ? (
                    <Image src={firebaseUser.photoURL} alt="User" width={24} height={24} className="rounded-full object-cover" />
                  ) : (
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-600 text-white font-bold text-xs">
                      {firebaseUser.displayName?.[0]?.toUpperCase() || firebaseUser.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                  <span className="text-xs font-medium">Account</span>
                </button>
                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition text-sm"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition text-sm"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/browse-history"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition text-sm"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      Browse History
                    </Link>
                    {isSeller && (
                      <Link
                        href="/store"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition text-sm"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                    )}
                    <div className="my-1 border-t border-gray-200" />
                    <button
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition text-sm"
                      onClick={async () => {
                        await auth.signOut();
                        setUserDropdownOpen(false);
                        router.push('/');
                        toast.success('Signed out successfully');
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSignInOpen(true)}
                className="flex flex-col items-center gap-0.5 hover:text-red-600 transition text-gray-600"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="text-xs font-medium">Account</span>
              </button>
            )}
          </div>

          {/* Mobile Right Side - Login Icon + Cart */}
          <div className="lg:hidden flex items-center gap-3">
            {/* Store Dashboard Badge for Mobile - Shows if user is a seller */}
            {isSeller && (
              <Link
                href="/store"
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
              >
                <div className="w-7 h-7 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-xs shadow-md">
                  DB
                </div>
              </Link>
            )}
            
            {/* Show user avatar if signed in, else login icon */}
            {isHomePage && (
              firebaseUser ? (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  {firebaseUser.photoURL ? (
                    <Image src={firebaseUser.photoURL} alt="User" width={28} height={28} className="rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-600 text-white font-bold text-base">
                      {firebaseUser.displayName?.[0]?.toUpperCase() || firebaseUser.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setSignInOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>
              )
            )}
            
            {navActionsVisibility.cart && (
            <button onClick={handleCartClick} className="relative p-2">
              <ShoppingCart size={20} className="text-gray-700" />
              {isClient && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </button>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar - Dynamic from settings */}
        {navMenuEnabled && navMenuItems.length > 0 && (
        <div className="hidden lg:block border-t border-gray-200 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <div className="mx-auto max-w-[1320px] px-4">
            <div className="flex items-center justify-between gap-1 py-2">
            {navMenuItems.map((item, index) => {
              const isCollections = item.hasDropdown && item.name.toLowerCase().includes('collection');

              if (isCollections) {
                return (
                  <div
                    key={index}
                    className="relative flex-1 flex justify-center"
                    onMouseEnter={() => {
                      if (categoryTimer.current) clearTimeout(categoryTimer.current);
                      setCategoriesDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      if (categoryTimer.current) clearTimeout(categoryTimer.current);
                      categoryTimer.current = setTimeout(() => {
                        setCategoriesDropdownOpen(false);
                        setHoveredCategory(null);
                      }, 200);
                    }}
                  >
                    <button className="text-[13px] font-medium text-gray-700 hover:text-red-600 transition inline-flex items-center gap-1.5 hover:underline underline-offset-[10px] decoration-[1.5px] decoration-red-500 whitespace-nowrap">
                      {item.icon && (
                        <img
                          src={item.icon}
                          alt=""
                          className="w-4 h-4 object-contain opacity-80"
                          aria-hidden="true"
                        />
                      )}
                      {item.name}
                      <svg className={`w-4 h-4 transition-transform ${categoriesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {categoriesDropdownOpen && categories.length > 0 && (
                      <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden flex">
                        {/* Main Categories */}
                        <div className="w-64 bg-gray-50 border-r border-gray-200">
                          {categories.filter(cat => !cat.parentId).map((category) => {
                            const categorySlug = category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                            return (
                              <div
                                key={category._id}
                                className="relative"
                                onMouseEnter={() => setHoveredCategory(category._id)}
                              >
                                <Link
                                  href={`/shop?category=${categorySlug}`}
                                  className={`flex items-center justify-between px-4 py-3 hover:bg-red-50 transition ${
                                    hoveredCategory === category._id ? 'bg-red-50 text-red-600' : 'text-gray-700'
                                  }`}
                                  onClick={() => {
                                    setCategoriesDropdownOpen(false);
                                    setHoveredCategory(null);
                                  }}
                                >
                                  <span className="font-medium">{category.name}</span>
                                  {category.children && category.children.length > 0 && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  )}
                                </Link>
                              </div>
                            );
                          })}
                        </div>

                        {/* Subcategories */}
                        {hoveredCategory && (
                          <div className="w-64 bg-white p-4">
                            {categories
                              .find(cat => cat._id === hoveredCategory)
                              ?.children?.map((subcat) => {
                                const subcatSlug = subcat.slug || subcat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                                return (
                                  <Link
                                    key={subcat._id}
                                    href={`/shop?category=${subcatSlug}`}
                                    className="block px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                                    onClick={() => {
                                      setCategoriesDropdownOpen(false);
                                      setHoveredCategory(null);
                                    }}
                                  >
                                    {subcat.name}
                                  </Link>
                                );
                              })}
                            {(!categories.find(cat => cat._id === hoveredCategory)?.children?.length) && (
                              <p className="text-sm text-gray-400 px-3 py-2">No subcategories</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

  
              return (
                <Link
                  key={index}
                  href={item.link || '#'}
                  className="flex-1 justify-center text-[13px] font-medium text-gray-700 hover:text-red-600 transition inline-flex items-center gap-1.5 hover:underline underline-offset-[10px] decoration-[1.5px] decoration-red-500 whitespace-nowrap"
                >
                  {item.icon && (
                    <img
                      src={item.icon}
                      alt=""
                      className="w-4 h-4 object-contain opacity-80"
                      aria-hidden="true"
                    />
                  )}
                  {item.name}
                </Link>
              );
            })}
            </div>
          </div>
        </div>
        )}

        {/* Mobile Search Bar - Below main navbar on mobile */}
        <div className="lg:hidden pb-3 px-4" style={{ backgroundColor: '#ffffff' }}>
          <form onSubmit={handleSearch} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-100">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder || "Search for engagement rings"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent outline-none placeholder-gray-400 text-gray-700 text-sm"
            />
          </form>
        </div>

        {/* Mobile Overlay Menu */}
        {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-[9999]" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute top-0 left-0 w-3/4 max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col gap-4 overflow-y-auto animate-slideIn" 
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideInLeft 0.3s ease-out' }}
          >
              {/* Header with Logo and Close Button */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <Image src={require('../assets/logo/Asset 12.png')} alt="QuickFynd Logo" width={120} height={35} className="object-contain" />
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              {/* User Section */}
              {firebaseUser === undefined ? null : !firebaseUser ? (
                <button
                  type="button"
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition mb-4"
                  onClick={() => {
                    setSignInOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  Login
                </button>
              ) : (
                <div className="w-full px-4 py-3 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full mb-4 flex items-center gap-2">
                  {firebaseUser.photoURL ? (
                    <Image src={firebaseUser.photoURL} alt="User" width={28} height={28} className="rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-base">
                      {firebaseUser.displayName?.[0]?.toUpperCase() || firebaseUser.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                  <span className="font-medium">Hi, {firebaseUser.displayName || firebaseUser.email}</span>
                </div>
              )}

              {/* Links */}
              <div className="flex flex-col gap-1">
                {firebaseUser && (
                  <>
                    <Link 
                      href="/dashboard/profile" 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Profile</span>
                    </Link>
                    <Link 
                      href="/dashboard/orders" 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <PackageIcon size={18} className="text-gray-600" />
                      <span>My Orders</span>
                    </Link>
                    <Link 
                      href="/browse-history" 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Browse History</span>
                    </Link>
                    <button
                      className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition text-red-600 font-medium mt-2"
                      onClick={async () => {
                        await auth.signOut();
                        setMobileMenuOpen(false);
                        toast.success('Signed out successfully');
                        window.location.reload();
                      }}
                    >
                      Sign Out
                    </button>
                    <div className="px-4"><div className="h-px bg-gray-200 my-2" /></div>
                  </>
                )}
                <Link 
                  href="/top-selling" 
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Top Selling Items
                </Link>
                <Link 
                  href="/new" 
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  New Arrivals
                </Link>

                <Link 
                  href="/5-star-rated" 
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <StarIcon size={18} className="text-orange-500" fill="#FFA500" />
                  5 Star Rated
                </Link>

                <Link 
                  href="/fast-delivery" 
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                  Fast Delivery
                </Link>

                <Link 
                  href={firebaseUser ? "/dashboard/wishlist" : "/wishlist"}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <HeartIcon size={18} className="text-orange-500" />
                    <span>Wishlist</span>
                  </div>
                  {wishlistCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link 
                  href="/cart" 
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={18} className="text-blue-600" />
                    <span>Cart</span>
                  </div>
                  {cartCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link 
                  href="/orders" 
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PackageIcon size={18} className="text-gray-600" />
                  <span>My Orders</span>
                </Link>
                {isSeller && (
                  <Link 
                    href="/store" 
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">Seller</span>
                    <span>Dashboard</span>
                  </Link>
                )}
              </div>

              {/* Support Section */}
              <div className="mt-auto pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2 px-4">Support</p>
                <Link 
                  href="/faq" 
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition text-gray-700 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FAQ
                </Link>
                <Link 
                  href="/support" 
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition text-gray-700 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Support
                </Link>
                <Link 
                  href="/terms" 
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition text-gray-700 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Terms & Conditions
                </Link>
                <Link 
                  href="/privacy-policy" 
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition text-gray-700 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/return-policy" 
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition text-gray-700 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Return Policy
                </Link>
                {firebaseUser && (
                  <button
                    className="w-full text-left px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition text-red-600 font-medium mt-4"
                    onClick={async () => {
                      await auth.signOut();
                      setMobileMenuOpen(false);
                      toast.success('Signed out successfully');
                      window.location.reload();
                    }}
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sign In Modal (always at Navbar root) */}
      {!firebaseUser && <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />}
    </nav>
    </>
  );
};

export default Navbar;
