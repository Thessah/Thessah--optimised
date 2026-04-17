"use client";
import { useAuth } from "@/lib/useAuth";
import { ShoppingCartIcon, Heart, StarIcon } from 'lucide-react'
import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
// ...existing code...
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '@/lib/features/cart/cartSlice'
import { uploadCart } from '@/lib/features/cart/cartSlice'

import toast from 'react-hot-toast'

const ProductCard = ({ product }) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_LABEL || process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'AED'
    const dispatch = useDispatch()
    const { getToken } = useAuth()
    const cartItems = useSelector(state => state.cart.cartItems)
    const itemQuantity = cartItems[product._id] || 0

    // Review state and fetching logic (lazy-load on hover/focus)
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [reviewsLoaded, setReviewsLoaded] = useState(false);
    const cardRef = useRef(null);

    const fetchReviews = useCallback(async () => {
        if (reviewsLoaded) return;
        setLoadingReviews(true);
        try {
            const { data } = await import('axios').then(ax => ax.default.get(`/api/review?productId=${product._id}`));
            setReviews(data.reviews || []);
            setReviewsLoaded(true);
        } catch (error) {
            // silent fail
        } finally {
            setLoadingReviews(false);
        }
    }, [product._id, reviewsLoaded]);

    // Only fetch reviews on hover or focus
    const handleCardEnter = () => fetchReviews();

    // Calculate rating and count from fetched reviews, fallback to product fields
    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0) / reviews.length
        : (typeof product.averageRating === 'number' ? product.averageRating : 0);
    const ratingCount = reviews.length > 0
        ? reviews.length
        : (typeof product.ratingCount === 'number' ? product.ratingCount : 0);
    const ratingValue = Math.max(0, Math.min(5, Number(averageRating) || 0));

    // Calculate discount percentage
    const discount = product.AED && product.AED > product.price
        ? Math.round(((product.AED - product.price) / product.AED) * 100)
        : 0

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        dispatch(addToCart({ productId: product._id }))
        dispatch(uploadCart({ getToken }))
        toast.success('Added to cart')
    }

    const showPrice = Number(product.price) > 0 || Number(product.AED) > 0;

    return (
        <Link href={`/product/${product.slug}`} className="group w-full block">
            <div
                className="bg-white rounded-sm overflow-hidden flex flex-col h-full"
                ref={cardRef}
                onMouseEnter={handleCardEnter}
                onFocus={handleCardEnter}
                tabIndex={0}
            >
                {/* Product Image with hover swap */}
                <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                    {/* Main image */}
                    <div className={`absolute inset-0 transition-all duration-500 ${
                        product.images && Array.isArray(product.images) && product.images[1] && product.images[1].trim() !== ''
                            ? 'group-hover:opacity-0'
                            : 'group-hover:scale-105'
                    }`}>
                        <Image
                            src={
                                product.images && Array.isArray(product.images) && product.images[0] && typeof product.images[0] === 'string' && product.images[0].trim() !== ''
                                    ? product.images[0]
                                    : 'https://ik.imagekit.io/jrstupuke/placeholder.png'
                            }
                            alt={product.name}
                            fill
                            className="object-cover"
                            onError={e => {
                                if (e.currentTarget.src !== 'https://ik.imagekit.io/jrstupuke/placeholder.png') {
                                    e.currentTarget.src = 'https://ik.imagekit.io/jrstupuke/placeholder.png';
                                }
                            }}
                        />
                    </div>
                    {/* Second image on hover - only if exists */}
                    {product.images && Array.isArray(product.images) && product.images[1] && product.images[1].trim() !== '' && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <Image
                                src={product.images[1]}
                                alt={product.name + ' alt'}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    {/* Wishlist Heart Icon */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toast.success('Added to wishlist');
                        }}
                        className="absolute top-3 right-3 z-20 bg-white hover:bg-gray-50 p-2.5 rounded-full shadow-sm transition-all duration-200"
                    >
                        <Heart size={20} className="text-gray-700 hover:text-red-500 hover:fill-red-500 transition-colors" strokeWidth={1.5} />
                    </button>
                </div>
                {/* Product Details */}
                <div className="flex flex-col p-3.5 gap-1.5">
                    {/* Product Name */}
                    <h3 className="text-[17px] font-semibold tracking-tight text-slate-900 line-clamp-2 leading-[1.25]">
                        {product.name}
                    </h3>
                    {/* Reviews */}
                    <div
                        className="flex items-center gap-2"
                        aria-label={`Rating ${ratingCount > 0 ? ratingValue.toFixed(1) : '0.0'} out of 5 from ${ratingCount} reviews`}
                    >
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => {
                                const isFilled = ratingCount > 0 && star <= Math.round(ratingValue)
                                return (
                                    <StarIcon
                                        key={star}
                                        size={14}
                                        className={isFilled ? 'text-amber-500' : 'text-slate-300'}
                                        fill={isFilled ? 'currentColor' : 'none'}
                                    />
                                )
                            })}
                        </div>
                        <span className="text-xs font-medium text-slate-500">({ratingCount})</span>
                    </div>
                    {/* Price */}
                    {showPrice && (
                        <div className="flex items-end gap-2">
                            <span className="inline-flex items-end gap-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{currency}</span>
                                <span className="text-[33px] leading-none font-bold text-slate-900">{Number(product.price).toLocaleString('en-IN')}</span>
                            </span>
                            {Number(product.AED) > 0 && Number(product.AED) > Number(product.price) && (
                                <span className="text-xs font-medium text-slate-400 line-through pb-1">
                                    {currency} {Number(product.AED).toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>
                    )}
                    {/* Stock info */}
                    {product.stockQuantity && product.stockQuantity <= 3 && (
                        <span className="text-sm text-red-600">Only {product.stockQuantity} left!</span>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default ProductCard

