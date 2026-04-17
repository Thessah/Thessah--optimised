"use client"
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
// import axios from "axios";
import ProductCard from "@/components/ProductCard";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

function ProductPageSkeleton() {
    return (
        <div className="max-w-7xl mx-auto pb-24 lg:pb-0 animate-pulse">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="h-4 w-40 rounded bg-slate-200" />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="flex flex-col items-center space-y-3">
                    <div className="h-10 w-48 rounded bg-slate-200" />
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-20 rounded bg-slate-200" />
                        <div className="h-10 w-24 rounded bg-slate-200" />
                    </div>
                    <div className="h-4 w-36 rounded bg-slate-200" />
                    <div className="h-3 w-28 rounded bg-slate-200" />
                    <div className="flex items-center gap-4 pt-1">
                        <div className="h-4 w-14 rounded bg-slate-200" />
                        <div className="h-4 w-12 rounded bg-slate-200" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 gap-6 items-start">
                    <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden aspect-[4/3] md:aspect-square">
                        <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-slate-200" />
                        <div className="h-full w-full bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:self-start">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="aspect-square rounded-xl border border-gray-200 bg-slate-200" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full bg-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="h-10 w-64 rounded bg-slate-200 mx-auto mb-8" />

                    <div className="flex justify-center mb-8">
                        <div className="h-14 w-72 rounded-full bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            {Array.from({ length: 3 }).map((_, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="h-16 bg-slate-200" />
                                    <div className="p-4 space-y-3 bg-white">
                                        <div className="h-4 w-full rounded bg-slate-200" />
                                        <div className="h-4 w-5/6 rounded bg-slate-200" />
                                        <div className="h-4 w-2/3 rounded bg-slate-200" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-gray-200 p-5 space-y-4 bg-white">
                                <div className="h-5 w-32 rounded bg-slate-200" />
                                <div className="h-12 w-full rounded-xl bg-slate-200" />
                                <div className="h-12 w-full rounded-xl bg-slate-200" />
                                <div className="h-12 w-full rounded-xl bg-slate-200" />
                            </div>
                            <div className="rounded-2xl border border-gray-200 p-5 space-y-4 bg-white">
                                <div className="h-5 w-28 rounded bg-slate-200" />
                                <div className="h-4 w-full rounded bg-slate-200" />
                                <div className="h-4 w-4/5 rounded bg-slate-200" />
                                <div className="h-4 w-3/4 rounded bg-slate-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 mt-12 mb-16">
                <div className="h-8 w-52 rounded bg-slate-200 mb-6" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                    {Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx}>
                            <div className="aspect-square rounded-xl bg-slate-200 mb-3" />
                            <div className="h-4 w-4/5 rounded bg-slate-200 mb-2" />
                            <div className="h-4 w-2/5 rounded bg-slate-200" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function ProductBySlug() {
    const { slug } = useParams();
    const [product, setProduct] = useState();
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const products = useSelector(state => state.product.list);

    const fetchProduct = async () => {
        setLoading(true);
        let found = null;
        // Always prefer fresh product payload for visibility flags (Buy Now/Enquiry).
        try {
            const { data } = await axios.get(`/api/products/by-slug?slug=${encodeURIComponent(slug)}`);
            found = data.product || null;
        } catch {
            found = products.find((product) => product.slug === slug) || null;
        }
        setProduct(found);
        // Get related products from Redux if available
        if (found && products.length > 0) {
            const related = products
                .filter(p => p.slug !== slug && p.category === found.category && p.inStock)
                .slice(0, 5);
            setRelatedProducts(related);
        } else {
            setRelatedProducts([]);
        }
        setLoading(false);
    }

    const fetchReviews = async (productId) => {
        setLoadingReviews(true);
        try {
            const { data } = await axios.get(`/api/review?productId=${productId}`);
            setReviews(data.reviews || []);
        } catch (error) {
            setReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    };

    useEffect(() => {
        fetchProduct();
        scrollTo(0, 0);
    }, [slug, products]);


    useEffect(() => {
        if (product && product._id) {
            fetchReviews(product._id);
        }
    }, [product]);

    // Track browse history for signed-in users
    useEffect(() => {
        if (!product?._id) return;

        const trackView = async (user) => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                await axios.post('/api/browse-history', 
                    { productId: product._id },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (error) {
                // Silent fail - don't interrupt user experience
                console.log('Browse history tracking failed:', error.message);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) trackView(user);
        });

        return () => unsubscribe();
    }, [product]);

    return (
        <div className="lg:mx-6">
            <div className="max-w-7xl mx-auto pb-24 lg:pb-0">
                {/* Product Details */}
                {loading ? (
                    <ProductPageSkeleton />
                ) : product ? (
                    <>
                        <ProductDetails product={product} reviews={reviews} loadingReviews={loadingReviews} />
                        <ProductDescription product={product} reviews={reviews || []} loadingReviews={loadingReviews} onReviewAdded={() => fetchReviews(product._id)} />
                        {/* Related Products */}
                        {relatedProducts.length > 0 && (
                            <div className="px-4 mt-12 mb-16">
                                <h2 className="text-2xl font-semibold text-slate-800 mb-6">Related Products</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-6">
                                    {relatedProducts.map((prod) => (
                                        <ProductCard key={prod.id} product={prod} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 text-gray-400">Product not found.</div>
                )}
            </div>
        </div>
    );
}
