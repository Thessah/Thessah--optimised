'use client'
import { ArrowRight, StarIcon, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import ReviewForm from "./ReviewForm"
import axios from "axios"
import ProductCard from "./ProductCard"
import { useSelector } from "react-redux"

// Updated design - Noon.com style v2
const ProductDescription = ({ product, reviews = [], loadingReviews = false, onReviewAdded }) => {

    // Use reviews and loadingReviews from props only
    const [suggestedProducts, setSuggestedProducts] = useState([])
    const allProducts = useSelector((state) => state.product.list || [])
    const [showGuidesModal, setShowGuidesModal] = useState(false)
    const [selectedGuide, setSelectedGuide] = useState(null)
    const [showReviewModal, setShowReviewModal] = useState(false)

    // Calculate rating distribution
    const ratingCounts = [0, 0, 0, 0, 0]
    reviews.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
            ratingCounts[review.rating - 1]++
        }
    })

    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0

    useEffect(() => {
        fetchSuggestedProducts()
    }, [product._id, allProducts])

    const fetchSuggestedProducts = () => {
        // Filter products by same category or tags, exclude current product
        const related = allProducts.filter(p => {
            if (p._id === product._id) return false
            
            // Match by category
            if (p.category === product.category) return true
            
            // Match by tags if they exist
            if (product.tags && p.tags) {
                const productTags = Array.isArray(product.tags) ? product.tags : []
                const pTags = Array.isArray(p.tags) ? p.tags : []
                return productTags.some(tag => pTags.includes(tag))
            }
            
            return false
        })
        
        // Shuffle and take first 8 products
        const shuffled = related.sort(() => 0.5 - Math.random())
        setSuggestedProducts(shuffled.slice(0, 8))
    }

    // Remove fetchReviews and handleReviewAdded, use parent handler

    return (
        <div className="my-8">

            {/* Product Description Section */}
            {/* <div className="bg-white border border-gray-200 mb-6">
                <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-900">Product Descris ption</h2>
                </div>
                <div className="p-6">
                    <div 
                        className="max-w-none
                        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_h1]:mt-4
                        [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-3
                        [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mb-2 [&_h3]:mt-2
                        [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-4
                        [&_strong]:font-semibold [&_strong]:text-gray-900
                        [&_em]:italic [&_em]:text-gray-800
                        [&_u]:underline
                        [&_ul]:list-disc [&_ul]:list-inside [&_ul]:text-gray-700 [&_ul]:mb-4 [&_ul]:ml-4
                        [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:text-gray-700 [&_ol]:mb-4 [&_ol]:ml-4
                        [&_li]:text-gray-700 [&_li]:mb-1
                        [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800
                        [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-sm [&_img]:my-4
                        [&_video]:max-w-full [&_video]:w-full [&_video]:h-auto [&_video]:rounded-lg [&_video]:shadow-sm [&_video]:my-4
                        [&_figure]:my-6 [&_figure]:text-center
                        [&_figcaption]:text-sm [&_figcaption]:text-gray-600 [&_figcaption]:mt-2
                        [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-700 [&_blockquote]:my-4
                        [&_code]:bg-gray-100 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:text-red-600
                        [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
                        [&_pre_code]:bg-none [&_pre_code]:text-inherit [&_pre_code]:p-0
                        [&_hr]:border-t-2 [&_hr]:border-gray-300 [&_hr]:my-6
                        [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:border [&_table]:border-gray-300
                        [&_thead]:bg-gray-100
                        [&_thead_th]:text-left [&_thead_th]:px-4 [&_thead_th]:py-3 [&_thead_th]:font-semibold [&_thead_th]:text-gray-800 [&_thead_th]:border [&_thead_th]:border-gray-300
                        [&_tbody_tr]:border-b [&_tbody_tr]:border-gray-300
                        [&_tbody_tr:hover]:bg-gray-50
                        [&_tbody_tr:last-child]:border-b-0
                        [&_tbody_td]:px-4 [&_tbody_td]:py-3 [&_tbody_td]:text-gray-700 [&_tbody_td]:border [&_tbody_td]:border-gray-300
                        [&_tfoot_th]:text-left [&_tfoot_th]:px-4 [&_tfoot_th]:py-3 [&_tfoot_th]:font-semibold [&_tfoot_th]:text-gray-800 [&_tfoot_th]:border [&_tfoot_th]:border-gray-300 [&_tfoot_th]:bg-gray-50
                        [&_br]:block"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                </div>
            </div> */}

            {/* Find In Store Section */}
            <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-2 border-amber-200/50 rounded-2xl mb-6 overflow-hidden shadow-xl">
                {/* Sparkle Decorations */}
                <div className="absolute top-6 left-8 text-amber-300/40 animate-pulse">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z"/>
                    </svg>
                </div>
                <div className="absolute top-12 right-12 text-rose-300/40 animate-pulse" style={{animationDelay: '0.5s'}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z"/>
                    </svg>
                </div>
                <div className="absolute bottom-8 left-16 text-amber-300/30 animate-pulse" style={{animationDelay: '1s'}}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z"/>
                    </svg>
                </div>
                
                <div className="relative px-6 md:px-10 py-10 md:py-14">
                    <div className="max-w-5xl mx-auto">
                        {/* Icon Row */}
                        <div className="flex items-center justify-center gap-3 mb-6">
                            {/* Diamond Icon */}
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                                <path d="M12 2L2 9L12 22L22 9L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
                                <path d="M2 9H22M12 2L7 9M12 2L17 9M12 22V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            
                            {/* Ring Icon */}
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-rose-600">
                                <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M9 8L12 5L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="12" r="2" fill="currentColor"/>
                            </svg>
                            
                            {/* Crown Icon */}
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                                <path d="M5 16L3 7L7 10L12 4L17 10L21 7L19 16H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
                                <path d="M5 16H19V18C19 18.5523 18.5523 19 18 19H6C5.44772 19 5 18.5523 5 18V16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="7" cy="10" r="1.5" fill="currentColor"/>
                                <circle cx="12" cy="4" r="1.5" fill="currentColor"/>
                                <circle cx="17" cy="10" r="1.5" fill="currentColor"/>
                            </svg>
                        </div>
                        
                        <div className="text-center">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                                Loved It Online? Find It At A<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600">
                                    Thessah Store Near You
                                </span>
                            </h2>
                            <p className="text-base md:text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
                                Experience the elegance in person. Visit our store to see this exquisite piece and get expert guidance from our jewellery consultants.
                            </p>
                            
                            {/* Store Features */}
                            <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm md:text-base">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                    <span className="font-medium">Expert Consultation</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                                        <path d="M3 12L7 8L12 13L17 8L21 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M21 12V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span className="font-medium">Try Before You Buy</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                    <span className="font-medium">Multiple Locations</span>
                                </div>
                            </div>
                            
                            <Link 
                                href="/find-store"
                                className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-2xl hover:shadow-amber-500/50 transform hover:scale-105 hover:-translate-y-1"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Find Thessah Store
                                <ArrowRight size={24} />
                            </Link>
                        </div>
                    </div>
                </div>
                
                {/* Bottom Decorative Wave */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500"></div>
            </div>

            {/* Buying Guides Section */}
            <div className="relative h-[180px] md:h-[200px] rounded-2xl mb-6 overflow-hidden shadow-xl group">
                {/* Background Image with overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-700/95 via-amber-600/90 to-amber-700/95">
                    {/* Jewelry texture pattern overlay */}
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '60px 60px'
                    }}></div>
                </div>

                {/* Decorative Jewelry Elements */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-40 transition-opacity duration-500 hidden md:block">
                    <svg width="180" height="120" viewBox="0 0 180 120" fill="none">
                        {/* Necklace curve */}
                        <path d="M20 20 Q90 80 160 20" stroke="white" strokeWidth="3" fill="none" opacity="0.6"/>
                        {/* Pearl beads */}
                        <circle cx="30" cy="28" r="6" fill="white" opacity="0.8"/>
                        <circle cx="50" cy="42" r="6" fill="white" opacity="0.8"/>
                        <circle cx="70" cy="52" r="6" fill="white" opacity="0.8"/>
                        <circle cx="90" cy="58" r="7" fill="white" opacity="0.9"/>
                        <circle cx="110" cy="52" r="6" fill="white" opacity="0.8"/>
                        <circle cx="130" cy="42" r="6" fill="white" opacity="0.8"/>
                        <circle cx="150" cy="28" r="6" fill="white" opacity="0.8"/>
                        {/* Center pendant */}
                        <path d="M90 65 L85 75 L90 82 L95 75 Z" fill="white" opacity="0.9"/>
                    </svg>
                </div>

                {/* Content */}
                <div className="relative h-full flex items-center px-8 md:px-12">
                    <div className="flex-1">
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Not sure what to buy?
                        </h3>
                        <p className="text-white/90 text-sm md:text-base">
                            Let us help you in making that decision
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowGuidesModal(true)}
                        className="flex items-center gap-2 bg-red-800 hover:bg-red-900 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 shadow-lg group-hover:shadow-2xl group-hover:scale-105 whitespace-nowrap cursor-pointer"
                    >
                        View Buying Guides
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Buying Guides Modal */}
            {showGuidesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowGuidesModal(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {!selectedGuide ? (
                            // Guide Selection View
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-gray-800">Buying Guides</h2>
                                    <button 
                                        onClick={() => setShowGuidesModal(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-6">
                                    {/* Diamond Guide */}
                                    <button
                                        onClick={() => setSelectedGuide('diamond')}
                                        className="group text-center hover:transform hover:scale-105 transition-all duration-300"
                                    >
                                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:shadow-xl transition-shadow">
                                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                                                <path d="M12 2L2 9L12 22L22 9L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
                                                <path d="M2 9H22M12 2L7 9M12 2L17 9M12 22V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 text-lg">The Diamond Guide</h3>
                                    </button>

                                    {/* Gemstone Guide */}
                                    <button
                                        onClick={() => setSelectedGuide('gemstone')}
                                        className="group text-center hover:transform hover:scale-105 transition-all duration-300"
                                    >
                                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center group-hover:shadow-xl transition-shadow">
                                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-purple-600">
                                                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
                                                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                                                <path d="M12 4V8M12 16V20M20 12H16M8 12H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 text-lg">The Gemstone Guide</h3>
                                    </button>

                                    {/* Metal Guide */}
                                    <button
                                        onClick={() => setSelectedGuide('metal')}
                                        className="group text-center hover:transform hover:scale-105 transition-all duration-300"
                                    >
                                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center group-hover:shadow-xl transition-shadow">
                                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" className="text-gray-700">
                                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                                                <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                                            </svg>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 text-lg">The Metal Guide</h3>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Guide Detail View
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <button 
                                        onClick={() => setSelectedGuide(null)}
                                        className="text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                    <h2 className="text-2xl font-bold text-gray-800 flex-1">
                                        {selectedGuide === 'diamond' && 'The Diamond Guide'}
                                        {selectedGuide === 'gemstone' && 'The Gemstone Guide'}
                                        {selectedGuide === 'metal' && 'The Metal Guide'}
                                    </h2>
                                    <button 
                                        onClick={() => {
                                            setSelectedGuide(null)
                                            setShowGuidesModal(false)
                                        }}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="bg-black rounded-lg p-6 mb-6">
                                    <Image 
                                        src="https://ik.imagekit.io/p2slevyg1/diamond-shapes.jpg" 
                                        alt="Diamond shapes"
                                        width={600}
                                        height={300}
                                        className="w-full rounded-lg"
                                    />
                                </div>

                                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                                    {selectedGuide === 'diamond' && (
                                        <div>
                                            <p className="mb-4">While the shape of a diamond is not a part of the four "Cs", it is indirectly attributed to the cut. The shape of diamond plays an important role in the selection of any diamond, as it determines the style and appeal of the jewellery piece it is set in. Diamonds from Thessah are available in a wide range of shapes, including: round, princess, emerald, square, oval, radiant, pear, heart, marquise and cushion shaped.</p>
                                            
                                            <p className="mb-4"><strong>Cut</strong> – The cut of a diamond is defined by it's proportions, it's symmetry and it's polish. The expertise with which these steps of the cutting process have been executed determine the performance of the cut diamond. A polished diamond's beauty is shaped by it's complex relationship with light. The amazing display you see when looking at a diamond is a combination of three attributes:</p>
                                            
                                            <p className="mb-4"><strong>Brightness</strong> is the combined effect of all white light reflecting from the interior and the surface of a diamond.</p>
                                            
                                            <p className="mb-4"><strong>Fire or dispersion</strong>, describes the "flashes" of rainbow colour emitted from a diamond.</p>
                                            
                                            <p className="mb-2"><strong>Scintillation</strong> describes the interplay of light and dark areas and the sparkle you see when the diamond, the light, or the onlooker moves.</p>
                                        </div>
                                    )}
                                    
                                    {selectedGuide === 'gemstone' && (
                                        <div>
                                            <p className="mb-4">Gemstones are nature's most colorful treasures. From vibrant rubies to deep sapphires, each gemstone has its unique characteristics and appeal.</p>
                                            
                                            <p className="mb-4"><strong>Types of Gemstones</strong> – Gemstones are broadly classified into precious and semi-precious stones. Precious stones include diamonds, rubies, sapphires, and emeralds, while semi-precious stones encompass a wide variety including amethyst, topaz, and garnet.</p>
                                            
                                            <p className="mb-4"><strong>Color</strong> – The most important factor in gemstone selection is color. Look for stones with rich, vibrant hues and good saturation. The color should be evenly distributed throughout the stone.</p>
                                            
                                            <p className="mb-2"><strong>Clarity</strong> – Like diamonds, gemstones are graded for clarity. However, some inclusions are acceptable and even desirable in certain gemstones as they can indicate natural origin.</p>
                                        </div>
                                    )}
                                    
                                    {selectedGuide === 'metal' && (
                                        <div>
                                            <p className="mb-4">The choice of metal for your jewellery is as important as the gemstones it holds. Each metal has unique properties that affect durability, appearance, and value.</p>
                                            
                                            <p className="mb-4"><strong>Gold</strong> – Available in various karats (24K, 22K, 18K, 14K), gold is measured by its purity. 24K gold is pure gold, while lower karats contain alloys for added strength. Gold comes in yellow, white, and rose variations.</p>
                                            
                                            <p className="mb-4"><strong>Platinum</strong> – A premium metal known for its durability and natural white luster. Platinum is hypoallergenic and maintains its appearance over time, making it ideal for everyday wear.</p>
                                            
                                            <p className="mb-2"><strong>Silver</strong> – An affordable option with a bright, white appearance. Sterling silver (92.5% pure) is commonly used in jewellery for its balance of durability and beauty.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reviews Section */}
            <div className="bg-gradient-to-br from-amber-50 via-white to-rose-50 rounded-2xl border border-amber-100 shadow-lg overflow-hidden">
                {/* Header */}
                <div className="text-center pt-12 pb-8 px-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Customer Reviews</h2>
                    <p className="text-base md:text-lg text-gray-600">See what our clients have to say</p>
                </div>

                <div className="px-6 md:px-12 pb-12">
                    {/* Empty State / Write Review Card */}
                    {reviews.length === 0 ? (
                        <div className="max-w-lg mx-auto">
                            <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl p-12 text-center shadow-xl">
                                <h3 className="text-2xl font-bold text-white mb-6">
                                    Be the first to write a review
                                </h3>
                                <div className="flex items-center justify-center gap-2 mb-8">
                                    {Array(5).fill('').map((_, i) => (
                                        <StarIcon key={i} size={32} className="text-white/90" fill="white" />
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowReviewModal(true)}
                                    className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-900 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
                                >
                                    Write a review
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                            
                            {/* Review Form */}
                            <div id="review-form" className="mt-12 bg-white rounded-xl p-6 shadow-md border border-gray-200">
                                <ReviewForm productId={product._id} onReviewAdded={onReviewAdded} />
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Rating Overview */}
                            <div className="max-w-2xl mx-auto mb-12">
                                <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
                                    <div className="flex flex-col md:flex-row items-center gap-8">
                                        {/* Average Rating */}
                                        <div className="text-center md:border-r border-gray-200 md:pr-8">
                                            <div className="text-5xl font-bold text-gray-900 mb-2">{averageRating}</div>
                                            <div className="flex justify-center mb-2">
                                                {Array(5).fill('').map((_, i) => (
                                                    <StarIcon
                                                        key={i}
                                                        size={24}
                                                        fill={i < Math.round(averageRating) ? '#F59E0B' : '#E5E7EB'}
                                                        className="text-transparent"
                                                    />
                                                ))}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>

                                        {/* Rating Distribution */}
                                        <div className="flex-1 w-full">
                                            <div className="space-y-2">
                                                {[5, 4, 3, 2, 1].map((star) => {
                                                    const count = ratingCounts[star - 1];
                                                    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                                                    return (
                                                        <div key={star} className="flex items-center gap-3">
                                                            <span className="text-sm font-medium text-gray-700 w-8">{star}★</span>
                                                            <div className="flex-1 bg-gray-200 h-3 rounded-full overflow-hidden">
                                                                <div
                                                                    style={{ width: `${percentage}%` }}
                                                                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                                                                />
                                                            </div>
                                                            <span className="text-sm text-gray-600 w-12 text-right">{percentage}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Write Review Card */}
                            <div className="max-w-lg mx-auto mb-12">
                                <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl p-8 text-center shadow-xl">
                                    <h3 className="text-xl font-bold text-white mb-4">
                                        Share your experience
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 mb-6">
                                        {Array(5).fill('').map((_, i) => (
                                            <StarIcon key={i} size={24} className="text-white/90" fill="white" />
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setShowReviewModal(true)}
                                        className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-900 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
                                    >
                                        Write a review
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Reviews List */}
                            {loadingReviews ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto space-y-6 mb-12">
                                    {reviews.map((item, idx) => (
                                        <div key={item.id || item._id || idx} className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                                            <div className="flex gap-4">
                                                {/* User Avatar */}
                                                <div className="flex-shrink-0">
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                                        {(item.userId && item.userId.name && item.userId.name[0]) ? item.userId.name[0].toUpperCase() : 'U'}
                                                    </div>
                                                </div>
                                                
                                                {/* Review Content */}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-lg">{item.userId && item.userId.name ? item.userId.name : 'Anonymous'}</p>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                {Array(5).fill('').map((_, index) => (
                                                                    <StarIcon 
                                                                        key={index} 
                                                                        size={16} 
                                                                        className='text-transparent' 
                                                                        fill={item.rating >= index + 1 ? "#F59E0B" : "#E5E7EB"} 
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="text-gray-700 leading-relaxed mb-4">{item.review}</p>
                                                    
                                                    {item.images && item.images.length > 0 && (
                                                        <div className="flex gap-3 flex-wrap">
                                                            {item.images.map((img, idx) => (
                                                                <div key={idx} className="relative group">
                                                                    <Image
                                                                        src={img}
                                                                        alt={`Review image ${idx + 1}`}
                                                                        width={100}
                                                                        height={100}
                                                                        className="rounded-lg object-cover border-2 border-gray-200 hover:border-amber-400 transition-colors cursor-pointer shadow-sm"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Review Form */}
                            <div id="review-form" className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-md border border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Write Your Review</h3>
                                <p className="text-gray-600 mb-6">Share your thoughts about this product</p>
                                <ReviewForm productId={product._id} onReviewAdded={onReviewAdded} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Write Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowReviewModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-gradient-to-r from-amber-50 to-rose-50 border-b border-gray-200 px-8 py-6 flex items-center justify-between rounded-t-2xl">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Write Your Review</h2>
                                <p className="text-sm text-gray-600 mt-1">Share your experience with this product</p>
                            </div>
                            <button 
                                onClick={() => setShowReviewModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-8">
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900 mb-1">How Review Approval Works:</p>
                                        <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                                            <li>You must be signed in to write a review</li>
                                            <li>After submission, you'll see "Review Submitted" confirmation</li>
                                            <li>Store admin reviews and approves submissions from /store panel</li>
                                            <li>Once approved, your review becomes visible to all customers</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            <ReviewForm 
                                productId={product._id}
                                autoShowForm={true}
                                onReviewAdded={(newReview) => {
                                    setShowReviewModal(false)
                                    if (onReviewAdded) {
                                        onReviewAdded(newReview)
                                    }
                                }} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Suggested Products Section */}
            {suggestedProducts.length > 0 && (
                <div className="bg-white border border-gray-200 mt-6">
                    <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">You May Also Like</h2>
                        {product.category && (
                            <Link 
                                href={`/shop?category=${product.category}`}
                                className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
                            >
                                View All <ArrowRight size={16} />
                            </Link>
                        )}
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {suggestedProducts.map((suggestedProduct) => (
                                <ProductCard key={suggestedProduct._id} product={suggestedProduct} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
           
        </div>
    )
}

export default ProductDescription
