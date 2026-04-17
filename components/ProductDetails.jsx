'use client'

import { StarIcon, Share2Icon, HeartIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

import { useRouter } from "next/navigation";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";

import { addToCart, uploadCart } from "@/lib/features/cart/cartSlice";
import MobileProductActions from "./MobileProductActions";
import { useAuth } from '@/lib/useAuth';
import GoldRateWidget from './GoldRateWidget';
import DetailsCard from './DetailsCard';

const ProductDetails = ({ product, reviews = [] }) => {

  // --- State and logic ---
  const loading = useSelector(state => state.product?.status === 'loading');
  const currency = 'AED';
  const [mainImage, setMainImage] = useState(product.images?.[0]);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showWishlistToast, setShowWishlistToast] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState('');
  const [showCartToast, setShowCartToast] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();
  const cartCount = useSelector((state) => state.cart.total);
  const cartItems = useSelector((state) => state.cart.cartItems);

  // Reviews
  const [fetchedReviews, setFetchedReviews] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/api/review?productId=${product._id}`);
        setFetchedReviews(data.reviews || []);
      } catch {}
    })();
  }, [product._id]);
  const reviewsToUse = fetchedReviews.length > 0 ? fetchedReviews : reviews;
  const averageRating = reviewsToUse.length > 0
    ? reviewsToUse.reduce((acc, item) => acc + (item.rating || 0), 0) / reviewsToUse.length
    : (typeof product.averageRating === 'number' ? product.averageRating : 0);
  const reviewCount = reviewsToUse.length > 0
    ? reviewsToUse.length
    : (typeof product.ratingCount === 'number' ? product.ratingCount : 0);

  // Variants
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const bulkVariants = variants.filter(v => v?.options && (v.options.bundleQty || v.options.bundleQty === 0));
  const variantColors = [...new Set(variants.map(v => v.options?.color).filter(Boolean))];
  const variantSizes = [...new Set(variants.map(v => v.options?.size).filter(Boolean))];
  const [selectedColor, setSelectedColor] = useState(variantColors[0] || product.colors?.[0] || null);
  const [selectedSize, setSelectedSize] = useState(variantSizes[0] || product.sizes?.[0] || null);
  const [selectedBundleQty, setSelectedBundleQty] = useState(
    bulkVariants.length ? Number(bulkVariants[0].options.bundleQty) : null
  );
  const selectedVariant = (bulkVariants.length
    ? bulkVariants.find(v => Number(v.options?.bundleQty) === Number(selectedBundleQty))
    : variants.find(v => {
        const cOk = v.options?.color ? v.options.color === selectedColor : true;
        const sOk = v.options?.size ? v.options.size === selectedSize : true;
        return cOk && sOk;
      })
  ) || null;
  const effPrice = selectedVariant?.price ?? product.price;
  const effAED = selectedVariant?.AED ?? product.AED;
  const discountPercent = effAED > effPrice
    ? Math.round(((effAED - effPrice) / effAED) * 100)
    : 0;
  const shareMenuRef = useRef(null);
  const [isFading, setIsFading] = useState(false);
  const [dashboardDetails, setDashboardDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'priceBreakup'
  const [liveGoldRate, setLiveGoldRate] = useState(null);
  const normalizeGoldType = (val) => {
    if (!val) return null;
    const t = String(val).toLowerCase();
    if (t.includes('yellow')) return 'yellow';
    if (t.includes('white')) return 'white';
    if (t.includes('rose')) return 'rose';
    if (t.includes('platinum')) return 'platinum';
    return t;
  };

  const getGoldTypeOptions = () => {
    const fromDashboard = normalizeGoldType(dashboardDetails?.goldType);
    const fromProduct = normalizeGoldType(product.goldType);
    const unique = new Set([fromDashboard, fromProduct].filter(Boolean));
    if (unique.size > 0) return Array.from(unique);
    return ['yellow', 'white', 'rose', 'platinum'];
  };

  const goldTypeOptions = getGoldTypeOptions();
  const [selectedGoldType, setSelectedGoldType] = useState(normalizeGoldType(product.goldType) || goldTypeOptions[0] || 'yellow');
  const [expandedSections, setExpandedSections] = useState({
    metal: true,
    general: true,
    description: true,
  });
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  const formatMoney = (val) => {
    const num = Number(val);
    if (Number.isNaN(num)) return '0';
    return num.toLocaleString('en-AE', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  };

  useEffect(() => {
    // Trigger a quick fade-in whenever mainImage changes
    setIsFading(true);
    const t = setTimeout(() => setIsFading(false), 200);
    return () => clearTimeout(t);
  }, [mainImage]);

  // Prepare default enquiry message with product details
  useEffect(() => {
    const link = typeof window !== 'undefined' ? window.location.href : '';
    const firstImage = product.images?.[0] || '';
    setEnquiryMessage(
      `Hello, I'm interested in ${product.name} (SKU: ${product.sku || 'NA'}).\n` +
      (product.brand ? `Brand: ${product.brand}\n` : '') +
      `Product link: ${link}\nProduct image: ${firstImage}\n\nPlease let me know more details.`
    );
  }, [product._id]);

  // Load dashboard-provided overrides (from localStorage) if present
  useEffect(() => {
    try {
      const map = JSON.parse(localStorage.getItem('productDetailsOverrides') || '{}');
      setDashboardDetails(map?.[product._id] || null);
    } catch {}
  }, [product._id]);

  useEffect(() => {
    const normalized = normalizeGoldType(dashboardDetails?.goldType) || normalizeGoldType(product.goldType) || goldTypeOptions[0] || 'yellow';
    setSelectedGoldType(normalized);
  }, [dashboardDetails?.goldType, product.goldType]);

  // Wishlist status
  useEffect(() => {
    (async () => {
      try {
        if (isSignedIn) {
          const { data } = await axios.get('/api/wishlist');
          setIsInWishlist(data.wishlist?.some(item => item.productId === product._id));
        } else {
          const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
          setIsInWishlist(guestWishlist.some(item => item && item.productId === product._id));
        }
      } catch {}
    })();
  }, [isSignedIn, product._id]);

  // Fetch live gold rate if product has gold and auto-calculate price
  useEffect(() => {
    (async () => {
      try {
        setIsCalculatingPrice(true);
        const { data } = await axios.get('/api/gold-rate');
        
        // API returns rates object with perGram24K, perGram22K, perGram18K
        if (data?.rates) {
          // Default to 22K gold rate, or use 24K/18K based on product
          const goldKarat = product.attributes?.goldPurityKarat || 22;
          let rateToUse = data.rates.perGram22K; // default
          
          if (goldKarat == 24) rateToUse = data.rates.perGram24K;
          else if (goldKarat == 18) rateToUse = data.rates.perGram18K;
          else if (goldKarat == 22) rateToUse = data.rates.perGram22K;
          
          setLiveGoldRate(rateToUse);
          
          // Auto-calculate approximate price
          const goldWeight = Number(product.goldWeight) || 0;
          const goldRate = Number(product.goldRate) || rateToUse || 0;
          const stonePrice = Number(product.stonePrice) || 0;
          const makingCharges = Number(product.makingCharges) || 0;
          
          if (goldWeight > 0 && goldRate > 0) {
            const goldValue = goldWeight * goldRate;
            const subTotal = goldValue + stonePrice;
            const makingTotal = subTotal + makingCharges;
            const vat = makingTotal * 0.05; // 5% VAT
            const total = makingTotal + vat;
            setCalculatedPrice(total);
          }
        }
      } catch (err) {
        console.error('Failed to fetch gold rate:', err);
      } finally {
        setIsCalculatingPrice(false);
      }
    })();
  }, [product.goldType, product.goldWeight, product.goldRate, product.stonePrice, product.makingCharges, product.attributes?.goldPurityKarat]);

  // Share menu outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  // --- Handlers ---

  const handleWishlist = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (isSignedIn) {
        const action = isInWishlist ? 'remove' : 'add';
        await axios.post('/api/wishlist', { productId: product._id, action });
        setIsInWishlist(!isInWishlist);
        setWishlistMessage(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist!');
      } else {
        const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
        if (isInWishlist) {
          localStorage.setItem('guestWishlist', JSON.stringify(guestWishlist.filter(item => item && item.productId !== product._id)));
          setIsInWishlist(false);
          setWishlistMessage('Removed from wishlist');
        } else {
          guestWishlist.push({
            productId: product._id,
            name: product.name,
            price: effPrice,
            AED: effAED,
            images: product.images,
            discount: discountPercent,
            inStock: product.inStock,
            addedAt: new Date().toISOString()
          });
          localStorage.setItem('guestWishlist', JSON.stringify(guestWishlist));
          setIsInWishlist(true);
          setWishlistMessage('Added to wishlist!');
        }
      }
      setShowWishlistToast(true);
      window.dispatchEvent(new Event('wishlistUpdated'));
      setTimeout(() => setShowWishlistToast(false), 3000);
    } catch {
      setWishlistMessage('Failed to update wishlist');
      setShowWishlistToast(true);
      setTimeout(() => setShowWishlistToast(false), 3000);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out ${product.name}`;
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    };
    if (shareUrls[platform]) {
      const win = window.open(shareUrls[platform], '_blank', 'noopener,noreferrer,width=600,height=700');
      // Fallback for browsers that block popup windows
      if (!win) {
        window.location.href = shareUrls[platform];
      }
      setShowShareMenu(false);
    }
  };

  const toggleShareMenu = async () => {
    // Use native share on supported mobile browsers for better reliability.
    if (typeof navigator !== 'undefined' && navigator.share && typeof window !== 'undefined' && window.innerWidth < 768) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name}`,
          url: window.location.href,
        });
        return;
      } catch {
        // User canceled or browser failed; fall back to menu toggle.
      }
    }
    setShowShareMenu((prev) => !prev);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowShareMenu(false);
      }, 2000);
    } catch {}
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/appointment', {
        name: enquiryName,
        email: enquiryEmail,
        phone: enquiryPhone,
        message: enquiryMessage,
        productId: product._id,
        image: product.images?.[0] || null,
      });
      setShowEnquiryModal(false);
      setEnquiryName('');
      setEnquiryEmail('');
      setEnquiryPhone('');
      alert('Your enquiry has been sent. Our team will contact you soon.');
    } catch (err) {
      console.error('Failed to send enquiry', err);
      alert('Failed to send enquiry. Please try again later.');
    }
  };

  const handleOrderNow = () => {
    for (let i = 0; i < quantity; i++) {
      dispatch(addToCart({ productId: product._id }));
    }
    router.push('/cart');
  };

  const handleAddToCart = async () => {
    for (let i = 0; i < quantity; i++) {
      dispatch(addToCart({ productId: product._id }));
    }
    if (isSignedIn) {
      try {
        await dispatch(uploadCart()).unwrap();
      } catch {}
    }
    setShowCartToast(true);
    setTimeout(() => setShowCartToast(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-gray-500 text-lg">Loading product…</div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-gray-400 text-lg">Product not found.</div>
    );
  }
  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm">
            <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
            <span className="text-gray-400">&gt;</span>
            <a href={`/categories/${product.category}`} className="text-gray-600 hover:text-gray-900">{product.category}</a>
          </div>
        </div>
      </div>

      {/* Title + Price */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-gray-900">{product.name}</h1>
          <div className="flex items-center justify-center gap-3 text-gray-900">
            <span className="text-3xl md:text-4xl font-bold">{currency === 'AED' ? 'AED' : currency}</span>
            <span className="text-3xl md:text-4xl font-bold">{formatMoney(effPrice || effAED || calculatedPrice || 0)}</span>
            {effAED && effAED > effPrice && (
              <span className="text-lg text-gray-500 line-through">{formatMoney(effAED)}</span>
            )}
          </div>
          {calculatedPrice && !effPrice && (
            <div className="text-sm text-orange-600 font-semibold animate-pulse">✨ Auto-calculated from live gold rate</div>
          )}
          {isCalculatingPrice && (
            <div className="text-sm text-gray-500 italic">📊 Calculating price...</div>
          )}
          <div className="text-sm text-gray-500">Incl. taxes and charges</div>
          <div className="flex items-center justify-center gap-4 text-sm text-orange-700">
            <button type="button" className="flex items-center gap-1 hover:text-orange-800">
              {/* <span className="text-base">🧡</span>
              <span>Try It On</span> */}
            </button>
            <button type="button" className="flex items-center gap-1 hover:text-orange-800" onClick={handleWishlist} disabled={wishlistLoading}>
              <HeartIcon size={16} className={isInWishlist ? 'text-red-500' : 'text-orange-700'} strokeWidth={2} />
              <span>{isInWishlist ? 'Saved' : 'Wishlist'}</span>
            </button>
            <div className="relative">
              <button type="button" className="flex items-center gap-1 hover:text-orange-800" onClick={toggleShareMenu}>
                <Share2Icon size={16} className="text-orange-700" strokeWidth={2} />
                <span>Share</span>
              </button>

              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <div ref={shareMenuRef} className="absolute left-1/2 top-full mt-2 -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-64 z-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Share this product</h3>
                  <button onClick={() => setShowShareMenu(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sky-50 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Twitter</span>
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Telegram</span>
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-left border-t border-gray-200 mt-2 pt-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center p-4" onClick={() => setShowEnquiryModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="grid md:grid-cols-[1fr_1.5fr] grid-cols-1">
              <div className="relative bg-gray-50 p-4 flex items-center justify-center">
                <div className="aspect-square w-full max-w-xs rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <Image
                    src={product.images?.[0] || 'https://ik.imagekit.io/jrstupuke/placeholder.png'}
                    alt={product.name}
                    width={320}
                    height={320}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
              <form className="p-6 space-y-4" onSubmit={handleEnquirySubmit}>
                <h3 className="text-lg font-semibold text-gray-900">Product Enquiry</h3>
                <p className="text-sm text-gray-600">Fill your details and edit the message if needed.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600">Name</label>
                    <input type="text" value={enquiryName} onChange={(e) => setEnquiryName(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Email</label>
                    <input type="email" value={enquiryEmail} onChange={(e) => setEnquiryEmail(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Phone</label>
                    <input type="tel" value={enquiryPhone} onChange={(e) => setEnquiryPhone(e.target.value)} required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div className="hidden md:block"></div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Message</label>
                  <textarea value={enquiryMessage} onChange={(e) => setEnquiryMessage(e.target.value)} rows={5} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"></textarea>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowEnquiryModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700">Send Enquiry</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-[2fr_1fr] grid-cols-1 gap-6 items-start">

          <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden aspect-[4/3] md:aspect-square">
            {product.attributes?.condition === 'used' && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Used
                </span>
              </div>
            )}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:border-gray-300 transition"
              >
                <HeartIcon 
                  size={18} 
                  fill={isInWishlist ? '#ef4444' : 'none'} 
                  className={isInWishlist ? 'text-red-500' : 'text-gray-600'}
                  strokeWidth={2} 
                />
              </button>
            </div>
            <Image
              src={mainImage || 'https://ik.imagekit.io/jrstupuke/placeholder.png'}
              alt={product.name}
              fill
              className={`object-cover transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}
              sizes="(min-width:1024px) 700px, 100vw"
              priority
              onError={(e) => { e.currentTarget.src = 'https://ik.imagekit.io/jrstupuke/placeholder.png'; }}
            />
          </div>

          {/* Thumbnails rail (2 columns, auto rows) */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-2 gap-4 md:self-start">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`relative aspect-square rounded-xl overflow-hidden border bg-white shadow-sm transition ${
                    mainImage === img ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={img || 'https://ik.imagekit.io/jrstupuke/placeholder.png'}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="160px"
                    onError={(e) => { e.currentTarget.src = 'https://ik.imagekit.io/jrstupuke/placeholder.png'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

     
      {/* Jewellery Details Section - Moved to end */}
      <div className="w-full bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-8 text-gray-900 text-center">Jewellery Details</h2>
          
          {/* Tab Buttons */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-full border border-[#8B2323]/30 shadow-lg overflow-hidden bg-white">
              <button 
                onClick={() => setActiveTab('details')}
                className={`font-semibold px-6 md:px-10 py-2 md:py-3 transition ${
                  activeTab === 'details' 
                    ? 'bg-[#8B2323] text-white shadow-[0_10px_25px_-10px_rgba(139,35,35,0.55)]' 
                    : 'text-[#8B2323] bg-white'
                }`}
              >
                Product Details
              </button>
              <button 
                onClick={() => setActiveTab('priceBreakup')}
                className={`font-semibold px-6 md:px-10 py-2 md:py-3 transition border-l border-[#8B2323]/20 ${
                  activeTab === 'priceBreakup' 
                    ? 'bg-[#8B2323] text-white shadow-[0_10px_25px_-10px_rgba(139,35,35,0.55)]' 
                    : 'text-[#8B2323] bg-white'
                }`}
              >
                <div className="flex flex-col leading-tight">
                  <span>Price Breakup</span>
                  <span className="text-[11px] md:text-xs font-normal opacity-80">Optional</span>
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Accordion Details - Full width on mobile */}
              <div className="lg:col-span-2 space-y-4">
                {(() => {
                  const metalItems = (dashboardDetails?.metalDetails && Array.isArray(dashboardDetails.metalDetails) && dashboardDetails.metalDetails.length)
                    ? dashboardDetails.metalDetails
                    : (product.metalDetails && Array.isArray(product.metalDetails) && product.metalDetails.length)
                    ? product.metalDetails
                    : [
                        { label: 'Gold Type', value: product.goldType ? (product.goldType.charAt(0).toUpperCase() + product.goldType.slice(1)) : null },
                        { label: 'Karatage', value: product.attributes?.goldPurityKarat ? `${product.attributes.goldPurityKarat}K` : null },
                        { label: 'Material Colour', value: product.attributes?.color },
                        { label: 'Metal', value: product.attributes?.metalType },
                        { label: 'Size', value: product.attributes?.size },
                      ];
                  const generalItems = (dashboardDetails?.generalDetails && Array.isArray(dashboardDetails.generalDetails) && dashboardDetails.generalDetails.length)
                    ? dashboardDetails.generalDetails
                    : (product.generalDetails && Array.isArray(product.generalDetails) && product.generalDetails.length)
                    ? product.generalDetails
                    : [
                        { label: 'Jewellery Type', value: product.attributes?.jewelleryType },
                        { label: 'Brand', value: product.attributes?.brand || product.brand },
                        { label: 'Collection', value: product.attributes?.collection },
                        { label: 'Gender', value: product.attributes?.gender },
                        { label: 'Occasion', value: product.attributes?.occasion },
                      ];
                  return (
                    <>
                      {/* Metal Details Accordion */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                        <button
                          onClick={() => toggleSection('metal')}
                          className="w-full flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 px-4 py-4 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🪙</span>
                            <h3 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">Metal Details</h3>
                          </div>
                          <svg className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${expandedSections.metal ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>
                        {expandedSections.metal && (
                          <div className="px-4 md:px-6 py-4 space-y-3 border-t border-gray-200 bg-white">
                            {metalItems.filter(item => item.value).map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-2 px-2 bg-gray-50 rounded">
                                <span className="text-gray-600 text-xs md:text-sm font-medium">{item.label}</span>
                                <span className="font-semibold text-gray-900 text-xs md:text-sm">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* General Details Accordion */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                        <button
                          onClick={() => toggleSection('general')}
                          className="w-full flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 px-4 py-4 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📋</span>
                            <h3 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">General Details</h3>
                          </div>
                          <svg className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${expandedSections.general ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>
                        {expandedSections.general && (
                          <div className="px-4 md:px-6 py-4 space-y-3 border-t border-gray-200 bg-white">
                            {generalItems.filter(item => item.value).map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-2 px-2 bg-gray-50 rounded">
                                <span className="text-gray-600 text-xs md:text-sm font-medium">{item.label}</span>
                                <span className="font-semibold text-gray-900 text-xs md:text-sm text-right">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Description Accordion */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                        <button
                          onClick={() => toggleSection('description')}
                          className="w-full flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 px-4 py-4 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📝</span>
                            <h3 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide">Description</h3>
                          </div>
                          <svg className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${expandedSections.description ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>
                        {expandedSections.description && (
                          <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-white">
                            <div className="text-xs md:text-sm text-gray-700 prose prose-sm max-w-none [&_p]:mb-3 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-1 [&_img]:max-w-full [&_img]:rounded [&_img]:my-2" dangerouslySetInnerHTML={{ __html: product.attributes?.description || product.description || '<p>No description available.</p>' }} />
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Right: Product Image and Actions */}
              <div className="lg:col-span-1 flex flex-col items-center gap-4">
                <div className="w-full text-right text-xs text-gray-500">SKU ID : {product.sku || 'NA'}</div>
                <div className="w-full flex justify-center">
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center aspect-square w-full max-w-xs">
                    <Image
                      src={product.images?.[0] || 'https://ik.imagekit.io/jrstupuke/placeholder.png'}
                      alt={product.name}
                      width={350}
                      height={350}
                      className="object-cover w-full h-full"
                      onError={(e) => { e.currentTarget.src = 'https://ik.imagekit.io/jrstupuke/placeholder.png'; }}
                    />
                  </div>
                </div>
                <div className="w-full flex flex-col gap-3">
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg p-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                    >
                      <MinusIcon size={16} className="text-gray-600" />
                    </button>
                    <span className="text-lg font-semibold text-gray-900 min-w-[40px] text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                    >
                      <PlusIcon size={16} className="text-gray-600" />
                    </button>
                  </div>

                  {/* Buy Now Button - Always visible unless explicitly disabled */}
                  {product.showBuyButton !== false && (
                    <button
                      type="button"
                      onClick={handleOrderNow}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 text-white px-6 py-3 text-sm font-semibold shadow-md hover:bg-orange-700 transition"
                    >
                      <ShoppingCartIcon size={16} className="text-white" strokeWidth={2} />
                      <span>Buy Now</span>
                    </button>
                  )}

                  {/* Enquiry Button */}
                  {product.enableEnquiry && product.showEnquiryButton !== false && (
                    <button
                      type="button"
                      onClick={() => setShowEnquiryModal(true)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-orange-600 text-orange-700 px-6 py-3 text-sm font-semibold shadow-sm hover:bg-orange-50 transition"
                    >
                      <StarIcon size={16} className="text-orange-700" strokeWidth={2} />
                      <span>Enquiry</span>
                    </button>
                  )}
                </div>
                <div className="w-full text-center text-[#B8860B] text-xs py-3 border-t border-gray-200 mt-2">
                  <span className="inline-flex items-center gap-1">
                    <span>🪙</span>
                    Free cleaning service!
                  </span>
                </div>
              </div>
            </div>
        ) : (
          /* Price Breakup Tab */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: selector + table (span 2) */}
            <div className="lg:col-span-2">
              <div className="mb-6">
              <label className="text-gray-700 font-semibold block mb-3">Select Gold Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {goldTypeOptions.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedGoldType(type)}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition ${
                      selectedGoldType === type
                        ? 'border-[#8B2323] bg-[#8B2323] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#8B2323]'
                    }`}
                  >
                    {type === 'yellow' && '🪙 Yellow'}
                    {type === 'white' && '🩶 White'}
                    {type === 'rose' && '🌹 Rose'}
                    {type === 'platinum' && '⭐ Platinum'}
                    {!['yellow','white','rose','platinum'].includes(type) && type}
                  </button>
                ))}
              </div>
              </div>
            {(() => {
              const goldWeight = Number(product.goldWeight) || 0;
              const goldRate = Number(product.goldRate) || (liveGoldRate || 0);
              const stoneWeight = Number(product.stoneWeight) || 0;
              const stonePrice = Number(product.stonePrice) || 0;
              const makingCharges = Number(product.makingCharges) || 0;
              const goldKarat = Number(product.attributes?.goldPurityKarat) || 22;
              
              const hasPriceData = goldWeight > 0 || stoneWeight > 0 || stonePrice > 0 || makingCharges > 0 || Number(product.price) > 0;
              const goldValue = goldWeight * goldRate;
              const subTotal = goldValue + stonePrice;
              const discount = Number(product.AED) > Number(product.price) ? (Number(product.AED) - Number(product.price)) : 0;
              const subtotalAfterDiscount = subTotal + makingCharges - discount;
              const gst = subtotalAfterDiscount * 0.05; // 5% GST
              const grandTotal = subtotalAfterDiscount + gst;
              
              const goldTypeDisplay = {
                yellow: 'Yellow Gold',
                white: 'White Gold',
                rose: 'Rose Gold',
                platinum: 'Platinum'
              }[selectedGoldType] || selectedGoldType || 'Gold';
              
              if (!hasPriceData) {
                return (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center text-gray-700">
                    <div className="text-3xl mb-3">ℹ️</div>
                    <p className="text-sm md:text-base font-semibold">Price breakup is not available for this product.</p>
                    <p className="text-xs text-gray-500 mt-2">Please contact support for a detailed quotation.</p>
                  </div>
                );
              }

              return (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">Product Details</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Rate</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Weight</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">Discount</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 uppercase">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {goldWeight > 0 && (
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <span className="text-2xl">🪙</span>
                            <div>
                              <div className="font-semibold text-gray-900">{goldTypeDisplay}</div>
                              <div className="text-xs text-gray-500">{goldKarat}KT</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">AED {formatMoney(goldRate)}/g ({goldKarat}K)</td>
                          <td className="px-6 py-4 text-center text-gray-700">{goldWeight.toFixed(3)}g</td>
                          <td className="px-6 py-4 text-center text-gray-700">-</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">₹ {formatMoney(goldValue.toFixed(2))}</td>
                        </tr>
                      )}
                      
                      {stoneWeight > 0 && (
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <span className="text-2xl">💎</span>
                            <div>
                              <div className="font-semibold text-gray-900">Stone</div>
                              {(() => {
                                const perCaratAttr = product.attributes?.stonePricePerCarat
                                const derived = stonePrice > 0 && stoneWeight > 0 ? (stonePrice/stoneWeight) : null
                                const show = perCaratAttr || derived
                                return show ? (
                                  <div className="text-[11px] text-gray-500">Per carat: AED {formatMoney((show).toFixed(2))}</div>
                                ) : null
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700">-</td>
                          <td className="px-6 py-4 text-center text-gray-700">{stoneWeight.toFixed(3)} ct / {(stoneWeight * 0.085).toFixed(3)} g</td>
                          <td className="px-6 py-4 text-center text-gray-700">-</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">AED {formatMoney(stonePrice.toFixed(0))}</td>
                        </tr>
                      )}
                      
                      {makingCharges > 0 && (
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-semibold text-gray-700" colSpan="4">Making Charges</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">AED {formatMoney(makingCharges.toFixed(2))}</td>
                        </tr>
                      )}
                      
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-4 text-gray-900" colSpan="4">Sub Total</td>
                        <td className="px-6 py-4 text-right text-gray-900">AED {formatMoney(subTotal.toFixed(2))}</td>
                      </tr>
                      
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-4 text-gray-700" colSpan="3"></td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-700">{goldWeight.toFixed(3)}g<br/>Gross Wt.</td>
                        <td className="px-6 py-4 text-right text-gray-900">AED {formatMoney(subTotal.toFixed(2))}</td>
                      </tr>
                      
                      {discount > 0 && (
                        <tr className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-gray-700" colSpan="4">Discount</td>
                          <td className="px-6 py-4 text-right text-green-600 font-semibold">-AED {formatMoney(discount.toFixed(2))}</td>
                        </tr>
                      )}
                      
                      <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-700" colSpan="4">Subtotal after Discount</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">AED {formatMoney(subtotalAfterDiscount.toFixed(2))}</td>
                      </tr>
                      
                      <tr className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-gray-700" colSpan="4">GST</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">AED {formatMoney(gst.toFixed(2))}</td>
                      </tr>
                      
                      <tr className="bg-gray-900 text-white">
                        <td className="px-6 py-5 text-lg font-bold" colSpan="4">Grand Total</td>
                        <td className="px-6 py-5 text-right text-xl font-bold">AED {formatMoney(grandTotal.toFixed(0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
            </div>
            {/* Right: product image + actions */}
            <div className="lg:col-span-1 flex flex-col items-center gap-4">
              <div className="w-full text-right text-xs text-gray-500">SKU ID : {product.sku || 'NA'}</div>
              <div className="w-full flex justify-center">
                <div className="bg-white rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center aspect-square w-full max-w-xs">
                  <Image
                    src={product.images?.[0] || 'https://ik.imagekit.io/jrstupuke/placeholder.png'}
                    alt={product.name}
                    width={350}
                    height={350}
                    className="object-cover w-full h-full"
                    onError={(e) => { e.currentTarget.src = 'https://ik.imagekit.io/jrstupuke/placeholder.png'; }}
                  />
                </div>
              </div>
              <div className="w-full flex flex-col gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg p-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                  >
                    <MinusIcon size={16} className="text-gray-600" />
                  </button>
                  <span className="text-lg font-semibold text-gray-900 min-w-[40px] text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                  >
                    <PlusIcon size={16} className="text-gray-600" />
                  </button>
                </div>

                {/* Buy Now Button */}
                {product.showBuyButton !== false && (
                  <button
                    type="button"
                    onClick={handleOrderNow}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 text-white px-6 py-3 text-sm font-semibold shadow-md hover:bg-orange-700 transition"
                  >
                    <ShoppingCartIcon size={16} className="text-white" strokeWidth={2} />
                    <span>Buy Now</span>
                  </button>
                )}

                {/* Enquiry Button */}
                {product.enableEnquiry && product.showEnquiryButton !== false && (
                  <button
                    type="button"
                    onClick={() => setShowEnquiryModal(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-orange-600 text-orange-700 px-6 py-3 text-sm font-semibold shadow-sm hover:bg-orange-50 transition"
                  >
                    <StarIcon size={16} className="text-orange-700" strokeWidth={2} />
                    <span>Enquiry</span>
                  </button>
                )}
              </div>
              <div className="w-full text-center text-[#B8860B] text-xs py-3 border-t border-gray-200 mt-2">
                <span className="inline-flex items-center gap-1">
                  <span>🪙</span>
                  Free cleaning service!
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Wishlist Toast */}
      {showWishlistToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 md:right-8 md:left-auto md:translate-x-0 bg-white border-2 border-orange-500 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3 z-[9999] animate-slide-up max-w-[90vw] md:max-w-none">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${wishlistMessage.includes('Added') ? 'bg-green-100' : 'bg-red-100'}`}>
            <HeartIcon 
              size={20} 
              className={wishlistMessage.includes('Added') ? 'text-green-600' : 'text-red-600'}
              fill={wishlistMessage.includes('Added') ? 'currentColor' : 'none'}
            />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{wishlistMessage}</p>
            {wishlistMessage.includes('Added') && (
              <a href="/wishlist" className="text-sm text-orange-500 hover:underline">View Wishlist</a>
            )}
          </div>
        </div>
      )}
      {/* Cart Toast */}
      {showCartToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 md:right-8 md:left-auto md:translate-x-0 bg-white border-2 border-green-500 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3 z-[9999] animate-slide-up max-w-[90vw] md:max-w-none">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
            <ShoppingCartIcon size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Added to cart!</p>
            <a href="/cart" className="text-sm text-orange-500 hover:underline">View Cart</a>
          </div>
        </div>
      )}

      {/* Mobile Actions Bar */}
      <MobileProductActions
        onOrderNow={handleOrderNow}
        onAddToCart={handleAddToCart}
        effPrice={effPrice}
        currency={currency}
        cartCount={cartCount}
      />

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;

