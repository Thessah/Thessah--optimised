'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useCallback, useMemo } from "react";
import {
  HeartIcon,
  ShoppingCartIcon,
  TrashIcon,
  CheckCircle2,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/lib/features/cart/cartSlice";
import PageTitle from "@/components/PageTitle";
import Loading from "@/components/Loading";
import DashboardSidebar from "@/components/DashboardSidebar";

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

  useEffect(() => {
    if (authLoading) return;
    isSignedIn ? loadUserWishlist() : loadGuestWishlist();
  }, [authLoading, isSignedIn]);

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
    selected.forEach((pid) => {
      const item = wishlist.find((i) => (i.productId || i.id) === pid);
      const product = getProduct(item);
      if (product) dispatch(addToCart({ product }));
    });
    router.push("/cart");
  };
  const total = selected.reduce((sum, pid) => {
    const item = wishlist.find((i) => (i.productId || i.id) === pid);
    const product = getProduct(item);
    return sum + Number(product?.price || 0);
  }, 0);
  if (authLoading || loading) return <Loading />;
  return (
    <>
      <PageTitle title="My Wishlist" />
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-8 md:py-10 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_340px] gap-6 md:gap-8">
        <main>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-[0_10px_35px_-18px_rgba(15,23,42,0.35)] border border-slate-200 p-5 md:p-6 mb-4">
            <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">Your Wishlist</h2>
              <span className="text-xs md:text-sm text-slate-500">{wishlist.length} item{wishlist.length === 1 ? '' : 's'}</span>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <input
                type="checkbox"
                checked={selected.length === wishlist.length && wishlist.length > 0}
                onChange={selectAll}
                className="accent-orange-500 w-5 h-5"
                id="selectAllWishlist"
              />
              <label htmlFor="selectAllWishlist" className="font-medium text-slate-800 select-none cursor-pointer">
                Select all ({wishlist.length})
              </label>
            </div>
            {wishlist.length === 0 ? (
              <div className="text-center py-20 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-dashed border-slate-200">
                <HeartIcon size={60} className="mx-auto text-slate-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900">Wishlist is empty</h2>
                <button
                  onClick={() => router.push("/shop")}
                  className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="space-y-3">
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
                    <div key={product._pid} className="flex items-center gap-4 p-3 md:p-4 group rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleSelect}
                        className="accent-orange-500 w-5 h-5 mt-1"
                        tabIndex={0}
                      />
                      <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-slate-200 shadow-sm">
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
                          <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                            -{discount}%
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold text-slate-900 truncate block max-w-[180px] md:max-w-[260px]">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-xl tracking-tight text-slate-900">AED {Number(product.price || 0).toLocaleString('en-IN')}</span>
                          {product.AED && (
                            <span className="text-xs text-slate-400 line-through">AED {Number(product.AED).toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <button
                          onClick={handleAddToCart}
                          className="bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={handleRemove}
                          className="text-red-500 hover:text-red-600 text-xs font-medium flex items-center gap-1"
                        >
                          <TrashIcon size={16} /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        {/* SUMMARY */}
        <aside className="sticky top-24 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-[0_12px_35px_-20px_rgba(15,23,42,0.45)] h-fit">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Selected</span>
              <span className="font-semibold text-slate-900">{selected.length}</span>
            </div>
            <div className="flex justify-between font-bold text-2xl pt-2 border-t border-slate-100">
              <span className="text-slate-900">Total</span>
              <span className="text-slate-900">AED {total.toFixed(2)}</span>
            </div>
          </div>
          <button
            disabled={selected.length === 0}
            onClick={addSelectedToCart}
            className={`w-full mt-5 py-3 rounded-xl font-semibold transition ${selected.length === 0 ? "bg-slate-200 text-slate-400" : "bg-orange-500 text-white hover:bg-orange-600"}`}
          >
            {selected.length === 0 ? "Go to Checkout" : `Checkout (${selected.length})`}
          </button>
        </aside>
      </div>
      {/* MOBILE CHECKOUT BAR */}
      {selected.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs">{selected.length} selected</p>
              <p className="font-bold">AED{total.toFixed(2)}</p>
            </div>
            <button
              onClick={addSelectedToCart}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
