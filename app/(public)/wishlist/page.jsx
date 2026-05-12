'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import {
  HeartIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/lib/features/cart/cartSlice";
import PageTitle from "@/components/PageTitle";
import Loading from "@/components/Loading";
import { countryCodes } from "@/assets/countryCodes";

const PLACEHOLDER_IMAGE = "/placeholder.png";

/* ----------------------------------------------------
   Normalize wishlist item (API / Guest safe)
---------------------------------------------------- */
const getProduct = (item) => {
  if (!item) return null;
  if (item.product) {
    return {
      ...item.product,
      _pid: item.productId || item.product.id,
    };
  }
  return {
    ...item,
    _pid: item.productId || item.id,
  };
};

export default function WishlistAuthed() {
  const { user, isSignedIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();
  const [wishlist, setWishlist] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyNowGlobalEnabled, setBuyNowGlobalEnabled] = useState(true);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryProduct, setEnquiryProduct] = useState(null);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [enquiryCountryCode, setEnquiryCountryCode] = useState('+971');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    isSignedIn ? loadUserWishlist() : loadGuestWishlist();
  }, [authLoading, isSignedIn]);

  useEffect(() => {
    const fetchBuyNowSetting = async () => {
      try {
        const cached = localStorage.getItem('buyNowGlobalEnabled');
        if (cached === 'false') setBuyNowGlobalEnabled(false);
        if (cached === 'true') setBuyNowGlobalEnabled(true);

        const { data } = await axios.get('/api/store/settings', { params: { t: Date.now() } });
        setBuyNowGlobalEnabled(data?.settings?.buyNowGlobalEnabled !== false);
      } catch {
        const cached = localStorage.getItem('buyNowGlobalEnabled');
        setBuyNowGlobalEnabled(cached !== 'false');
      }
    };
    fetchBuyNowSetting();

    const handleGlobalBuyNowChange = (event) => {
      if (typeof event?.detail?.enabled === 'boolean') {
        setBuyNowGlobalEnabled(event.detail.enabled);
      }
    };
    window.addEventListener('globalBuyNowSettingUpdated', handleGlobalBuyNowChange);
    return () => window.removeEventListener('globalBuyNowSettingUpdated', handleGlobalBuyNowChange);
  }, []);

  const loadGuestWishlist = () => {
    try {
      const data = JSON.parse(localStorage.getItem("guestWishlist") || "[]");
      setWishlist(Array.isArray(data) ? data : []);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };
  const loadUserWishlist = async () => {
    try {
      const token = await user.getIdToken(true);
      const { data } = await axios.get("/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(Array.isArray(data?.wishlist) ? data.wishlist : []);
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };
  const removeFromWishlist = async (pid) => {
    if (!isSignedIn) {
      const updated = wishlist.filter((i) => (i.productId || i.id) !== pid);
      localStorage.setItem("guestWishlist", JSON.stringify(updated));
      setWishlist(updated);
      setSelected((s) => s.filter((x) => x !== pid));
      return;
    }
    const token = await user.getIdToken(true);
    await axios.post(
      "/api/wishlist",
      { productId: pid, action: "remove" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setWishlist((w) => w.filter((i) => i.productId !== pid));
    setSelected((s) => s.filter((x) => x !== pid));
  };
  const toggleSelect = (pid) => {
    setSelected((s) =>
      s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]
    );
  };
  const selectAll = () => {
    setSelected(
      selected.length === wishlist.length
        ? []
        : wishlist.map((i) => i.productId || i.id)
    );
  };
  const addSelectedToCart = () => {
    if (!buyNowGlobalEnabled) return;
    selected.forEach((pid) => {
      const item = wishlist.find((i) => (i.productId || i.id) === pid);
      const product = getProduct(item);
      if (product && product.showBuyButton === true) dispatch(addToCart({ product }));
    });
    router.push("/cart");
  };

  const openEnquiryModal = (pid) => {
    const item = wishlist.find((i) => (i.productId || i.id) === pid);
    const product = getProduct(item);
    if (!product) return;
    setEnquiryProduct(product);
    setEnquiryMessage(
      `Hello, I'm interested in ${product.name}${product.sku ? ` (SKU: ${product.sku})` : ''}.\n\nPlease share availability, final price, and delivery details.`
    );
    setShowEnquiryModal(true);
  };

  const enquirySelected = () => {
    if (selected.length === 0) return;
    const enquiryPid = selected.find((pid) => {
      const item = wishlist.find((i) => (i.productId || i.id) === pid);
      const product = getProduct(item);
      return product && (product.showBuyButton !== true || !buyNowGlobalEnabled);
    }) || selected[0];
    openEnquiryModal(enquiryPid);
  };

  const submitEnquiry = async (e) => {
    e.preventDefault();
    if (!enquiryProduct || enquirySubmitting) return;

    try {
      setEnquirySubmitting(true);
      const normalizedPhone = enquiryPhone.trim().startsWith('+')
        ? enquiryPhone.trim()
        : `${enquiryCountryCode} ${enquiryPhone.trim()}`;

      await axios.post('/api/appointment', {
        name: enquiryName,
        email: enquiryEmail,
        phone: normalizedPhone,
        message: enquiryMessage,
        productId: enquiryProduct._id || enquiryProduct.id || enquiryProduct._pid,
        image: enquiryProduct.images?.[0] || null,
      });

      setShowEnquiryModal(false);
      setEnquiryName('');
      setEnquiryEmail('');
      setEnquiryPhone('');
      setEnquiryMessage('');
      setEnquiryProduct(null);
      alert('Enquiry sent successfully. Our team will contact you soon.');
    } catch {
      alert('Failed to send enquiry. Please try again later.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const canCheckoutSelected = selected.some((pid) => {
    const item = wishlist.find((i) => (i.productId || i.id) === pid);
    const product = getProduct(item);
    return buyNowGlobalEnabled && product?.showBuyButton === true;
  });
  const total = selected.reduce((sum, pid) => {
    const item = wishlist.find((i) => (i.productId || i.id) === pid);
    const product = getProduct(item);
    return sum + Number(product?.price || 0);
  }, 0);
  if (authLoading || loading) return <Loading />;
  return (
    <>
      <PageTitle title="My Wishlist" />
      <div className="min-h-screen bg-gradient-to-b from-[#fffaf3] via-[#fff] to-[#f9f5ef]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-7 md:py-10">
          <div className="mb-6 rounded-3xl border border-[#eadfcd] bg-gradient-to-r from-[#fff4de] via-[#fffaf1] to-[#f7efe2] p-5 md:p-7 shadow-[0_12px_36px_-24px_rgba(107,70,22,0.55)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#a67c36] font-semibold">Curated Collection</p>
                <h1 className="text-2xl md:text-3xl font-semibold text-[#2f2418]">Your Jewelry Wishlist</h1>
                <p className="text-sm md:text-base text-[#7a6650] mt-1">Handpicked pieces you loved, ready for your next purchase.</p>
              </div>
              <div className="rounded-2xl border border-[#e7d7be] bg-white/90 px-4 py-3 min-w-[160px]">
                <p className="text-xs text-[#8a7457]">Saved Pieces</p>
                <p className="text-2xl font-semibold text-[#2f2418]">{wishlist.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_350px] gap-6 md:gap-8">
            <main>
              <div className="bg-white/95 backdrop-blur rounded-3xl border border-[#ecdfcb] shadow-[0_20px_50px_-34px_rgba(86,54,19,0.6)] p-4 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[#f1e8da]">
                  <h2 className="text-lg md:text-xl font-semibold text-[#302216]">Wishlist Items</h2>
                  <span className="text-xs md:text-sm text-[#8a7457]">{wishlist.length} item{wishlist.length === 1 ? '' : 's'}</span>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <input
                    type="checkbox"
                    checked={selected.length === wishlist.length && wishlist.length > 0}
                    onChange={selectAll}
                    className="accent-[#b8892d] w-5 h-5"
                    id="selectAllWishlist"
                  />
                  <label htmlFor="selectAllWishlist" className="font-medium text-[#4a3a27] select-none cursor-pointer">
                    Select all ({wishlist.length})
                  </label>
                </div>

                {wishlist.length === 0 ? (
                  <div className="text-center py-20 rounded-2xl border border-dashed border-[#e8d8bf] bg-gradient-to-b from-[#fffdf8] to-[#fbf4e8]">
                    <HeartIcon size={58} className="mx-auto text-[#d0b890] mb-4" />
                    <h2 className="text-2xl font-semibold text-[#362717]">Your wishlist is empty</h2>
                    <p className="text-[#7f6a4f] mt-2">Discover timeless jewelry and save your favorites here.</p>
                    <button
                      onClick={() => router.push("/shop")}
                      className="mt-6 bg-[#b8873a] text-white px-7 py-3 rounded-xl font-semibold hover:bg-[#9b722f] transition"
                    >
                      Explore Collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wishlist.map((item) => {
                      const product = getProduct(item);
                      if (!product) return null;
                      const img = product.images?.[0] || PLACEHOLDER_IMAGE;
                      const isSelected = selected.includes(product._pid);
                      const handleSelect = (e) => { e.stopPropagation(); toggleSelect(product._pid); };
                      const handleRemove = (e) => { e.stopPropagation(); removeFromWishlist(product._pid); };
                      const handleAddToCart = (e) => { e.stopPropagation(); dispatch(addToCart({ product })); };
                      const discount = product.AED && product.AED > product.price ? Math.round(((product.AED - product.price) / product.AED) * 100) : 0;

                      return (
                        <div key={product._pid} className="group rounded-2xl border border-[#efe2cf] bg-gradient-to-r from-white to-[#fffbf4] p-3 md:p-4 hover:border-[#dec6a1] transition">
                          <div className="flex items-center gap-3 md:gap-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={handleSelect}
                              className="accent-[#b8892d] w-5 h-5"
                              tabIndex={0}
                            />

                            <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden border border-[#eddcc3] bg-white shadow-sm">
                              <Image
                                src={img}
                                alt={product.name}
                                fill
                                className="object-cover"
                                loading="lazy"
                                priority={false}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                                }}
                              />
                              {discount > 0 && (
                                <span className="absolute top-1 left-1 bg-[#2f9e63] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm z-10">
                                  -{discount}%
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[#2e2218] truncate max-w-[180px] md:max-w-[320px]">{product.name}</h3>
                              <p className="text-xs text-[#8a7457] mt-0.5 uppercase tracking-wide">Fine Jewelry</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="font-bold text-xl tracking-tight text-[#22170e]">AED {Number(product.price || 0).toLocaleString('en-IN')}</span>
                                {product.AED && (
                                  <span className="text-xs text-[#9f8b70] line-through">AED {Number(product.AED).toLocaleString('en-IN')}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 items-end">
                              {buyNowGlobalEnabled && product.showBuyButton === true ? (
                                <button
                                  onClick={handleAddToCart}
                                  className="bg-[#b8873a] text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-[#9f742f] transition"
                                >
                                  Add to Cart
                                </button>
                              ) : (
                                <button
                                  onClick={() => openEnquiryModal(product._pid)}
                                  className="bg-[#8b2f2f] text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-[#742525] transition"
                                >
                                  Enquiry
                                </button>
                              )}
                              <button
                                onClick={handleRemove}
                                className="text-[#c13b3b] hover:text-[#a22f2f] text-xs font-medium flex items-center gap-1"
                              >
                                <TrashIcon size={15} /> Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </main>

            <aside className="sticky top-24 h-fit rounded-3xl border border-[#ebdcc7] bg-white/95 p-5 md:p-6 shadow-[0_20px_45px_-30px_rgba(72,47,20,0.55)]">
              <h3 className="text-lg font-semibold text-[#322417]">{canCheckoutSelected ? 'Order Preview' : 'Enquiry Preview'}</h3>
              <p className="text-xs text-[#8d785d] mt-1 mb-4">Selected wishlist items</p>

              {!buyNowGlobalEnabled && (
                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  Buy Now is disabled globally. Only enquiry is available.
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#7f6a4f]">Selected</span>
                  <span className="font-semibold text-[#2b1f14]">{selected.length}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#efe3d1]">
                  <span className="text-lg font-semibold text-[#2b1f14]">Total</span>
                  <span className="text-2xl font-bold text-[#2b1f14]">AED {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                disabled={selected.length === 0}
                onClick={canCheckoutSelected ? addSelectedToCart : enquirySelected}
                className={`w-full mt-5 py-3 rounded-xl font-semibold transition ${selected.length === 0 ? "bg-[#ece6dc] text-[#b4a58f]" : canCheckoutSelected ? "bg-[#b8873a] text-white hover:bg-[#9c732f]" : "bg-[#8b2f2f] text-white hover:bg-[#742525]"}`}
              >
                {selected.length === 0 ? (canCheckoutSelected ? "Go to Checkout" : "Enquiry") : (canCheckoutSelected ? `Checkout (${selected.length})` : `Enquiry (${selected.length})`)}
              </button>
            </aside>
          </div>
        </div>
      </div>

      {/* MOBILE CHECKOUT BAR */}
      {selected.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#eadbc3] p-4 z-40">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-[#8f7a5f]">{selected.length} selected</p>
              <p className="font-bold text-[#2b1f14]">AED {total.toFixed(2)}</p>
            </div>
            <button
              onClick={canCheckoutSelected ? addSelectedToCart : enquirySelected}
              className={`text-white px-6 py-3 rounded-lg font-semibold ${canCheckoutSelected ? 'bg-[#b8873a]' : 'bg-[#8b2f2f]'}`}
            >
              {canCheckoutSelected ? 'Checkout' : 'Enquiry'}
            </button>
          </div>
        </div>
      )}

      {showEnquiryModal && enquiryProduct && (
        <div className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-3 md:p-6" onClick={() => setShowEnquiryModal(false)}>
          <div className="w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] h-full">
              <div className="bg-slate-50 p-4 md:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 flex lg:flex-col items-center lg:items-start gap-4">
                <div className="relative w-24 h-24 md:w-36 md:h-36 lg:w-full lg:aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white shrink-0">
                  <Image
                    src={enquiryProduct.images?.[0] || PLACEHOLDER_IMAGE}
                    alt={enquiryProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Selected Product</p>
                  <p className="text-sm md:text-base font-semibold text-slate-800 line-clamp-2">{enquiryProduct.name}</p>
                </div>
              </div>
              <div className="p-5 md:p-7 relative min-w-0 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setShowEnquiryModal(false)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-slate-700"
                  aria-label="Close"
                >
                  <XIcon size={20} />
                </button>
                <h3 className="text-2xl md:text-3xl font-semibold text-slate-900">Product Enquiry</h3>
                <p className="text-slate-600 mt-2 mb-5">Fill your details and edit the message if needed.</p>

                <form onSubmit={submitEnquiry} className="space-y-4 min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={enquiryName}
                        onChange={(e) => setEnquiryName(e.target.value)}
                        required
                        className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={enquiryEmail}
                        onChange={(e) => setEnquiryEmail(e.target.value)}
                        required
                        className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <div className="grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)] gap-2 min-w-0">
                      <select
                        value={enquiryCountryCode}
                        onChange={(e) => setEnquiryCountryCode(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-2 bg-white text-sm truncate"
                      >
                        {countryCodes.map((country) => (
                          <option key={`${country.label}-${country.code}`} value={country.code}>
                            {country.label} {country.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={enquiryPhone}
                        onChange={(e) => setEnquiryPhone(e.target.value)}
                        required
                        className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <textarea
                      rows={4}
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEnquiryModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={enquirySubmitting}
                      className={`px-5 py-2.5 rounded-xl text-white font-semibold ${enquirySubmitting ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                    >
                      {enquirySubmitting ? 'Sending...' : 'Send Enquiry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
