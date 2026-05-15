
'use client'
import { useAuth } from '@/lib/useAuth';

export const dynamic = 'force-dynamic'
import { useEffect, useState, useMemo } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import axios from "axios"
import { StarIcon, SearchIcon, PlusIcon, CheckCircleIcon, ClockIcon, MessageSquareIcon, XIcon } from "lucide-react"

function StarRating({ value, size = 14 }) {
    return (
        <div className="flex gap-0.5">
            {Array(5).fill('').map((_, i) => (
                <StarIcon
                    key={i}
                    size={size}
                    fill={value >= i + 1 ? "#F59E0B" : "#E5E7EB"}
                    className="text-transparent"
                />
            ))}
        </div>
    )
}

export default function StoreReviews() {
    const { getToken, user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [showAddModal, setShowAddModal] = useState(false)
    const [modalProductSearch, setModalProductSearch] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        rating: 5,
        review: '',
        images: []
    })

    const fetchReviews = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/reviews', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(data.products)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const handleApproval = async (reviewId, approved) => {
        try {
            const token = await getToken()
            await axios.post('/api/store/reviews/approve',
                { reviewId, approved },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            toast.success(approved ? 'Review approved' : 'Review rejected')
            fetchReviews()
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const handleSubmitReview = async (e) => {
        e.preventDefault()
        if (!selectedProduct) return toast.error('Please select a product')
        setSubmitting(true)
        try {
            const token = await getToken()
            const form = new FormData()
            form.append('productId', selectedProduct._id)
            form.append('rating', formData.rating)
            form.append('review', formData.review)
            form.append('customerName', formData.customerName)
            form.append('customerEmail', formData.customerEmail)
            formData.images.forEach((img) => form.append('images', img))

            await axios.post('/api/store/reviews', form, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success('Review added successfully')
            closeModal()
            fetchReviews()
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setSubmitting(false)
    }

    const closeModal = () => {
        setShowAddModal(false)
        setSelectedProduct(null)
        setModalProductSearch('')
        setFormData({ customerName: '', customerEmail: '', rating: 5, review: '', images: [] })
    }

    useEffect(() => {
        if (user) fetchReviews()
    }, [user])

    // Stats
    const stats = useMemo(() => {
        let total = 0, approved = 0, pending = 0
        products.forEach(p => {
            p.rating.forEach(r => {
                total++
                if (r.approved) approved++; else pending++
            })
        })
        return { total, approved, pending }
    }, [products])

    // Filtered products
    const filteredProducts = useMemo(() => {
        return products
            .map(p => {
                const matchName = p.name.toLowerCase().includes(search.toLowerCase())
                const filteredRatings = p.rating.filter(r => {
                    const statusMatch =
                        filterStatus === 'all' ||
                        (filterStatus === 'approved' && r.approved) ||
                        (filterStatus === 'pending' && !r.approved)
                    return statusMatch
                })
                if (!matchName && filteredRatings.length === 0) return null
                return { ...p, rating: search || filterStatus !== 'all' ? filteredRatings : p.rating }
            })
            .filter(Boolean)
    }, [products, search, filterStatus])

    // Products for modal search
    const modalProducts = useMemo(() => {
        if (!modalProductSearch.trim()) return products.slice(0, 8)
        return products.filter(p => p.name.toLowerCase().includes(modalProductSearch.toLowerCase())).slice(0, 8)
    }, [products, modalProductSearch])

    if (loading) return <Loading />

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Product Reviews</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage and moderate customer feedback</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition shadow-sm"
                >
                    <PlusIcon size={16} />
                    Add Review
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Reviews', value: stats.total, icon: <MessageSquareIcon size={18} />, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Approved', value: stats.approved, icon: <CheckCircleIcon size={18} />, color: 'text-green-600 bg-green-50' },
                    { label: 'Pending', value: stats.pending, icon: <ClockIcon size={18} />, color: 'text-yellow-600 bg-yellow-50' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                            <p className="text-xs text-slate-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by product name…"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                    />
                </div>
                <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden text-sm">
                    {['all', 'approved', 'pending'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            className={`px-4 py-2.5 capitalize font-medium transition ${filterStatus === f ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products & Reviews */}
            <div className="space-y-5">
                {filteredProducts.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <MessageSquareIcon size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No reviews match your search</p>
                    </div>
                )}
                {filteredProducts.map((product) => (
                    <div key={product._id || product.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Product Header */}
                        <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                            <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={52}
                                height={52}
                                className="rounded-xl object-cover border border-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800 truncate">{product.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {product.rating.length} review{product.rating.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => { setSelectedProduct(product); setShowAddModal(true) }}
                                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition"
                            >
                                <PlusIcon size={13} /> Add Review
                            </button>
                        </div>

                        {/* Reviews */}
                        <div className="divide-y divide-slate-100">
                            {product.rating.length === 0 && (
                                <p className="text-sm text-slate-400 px-5 py-4">No reviews yet</p>
                            )}
                            {product.rating.map((rev) => (
                                <div key={rev._id || rev.id} className="px-5 py-4">
                                    <div className="flex items-start gap-3">
                                        {rev.user ? (
                                            <Image
                                                src={rev.user.image?.trim() || '/placeholder.png'}
                                                alt={rev.user.name || 'avatar'}
                                                width={38}
                                                height={38}
                                                className="rounded-full border border-slate-200 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-500 text-sm font-bold">
                                                {(rev.customerName || '?')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="font-medium text-sm text-slate-800">
                                                    {rev.user?.name || rev.user?.email || rev.customerName || 'Unknown'}
                                                </span>
                                                <StarRating value={rev.rating} />
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rev.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {rev.approved ? 'Approved' : 'Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">{rev.review}</p>
                                            {rev.images?.length > 0 && (
                                                <div className="flex gap-2 mt-2">
                                                    {rev.images.map((img, idx) => (
                                                        <Image key={idx} src={img} alt="Review" width={72} height={72} className="rounded-lg object-cover border border-slate-200" />
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-2.5">
                                                <span className="text-xs text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                                {!rev.approved && (
                                                    <>
                                                        <button onClick={() => handleApproval(rev.id, true)} className="text-xs px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">Approve</button>
                                                        <button onClick={() => handleApproval(rev.id, false)} className="text-xs px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition font-medium">Reject</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Review Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form
                        onSubmit={handleSubmitReview}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800">Add Review</h2>
                            <button type="button" onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
                                <XIcon size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {/* Product Search */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Product *</label>
                                <div className="relative mb-2">
                                    <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={modalProductSearch}
                                        onChange={e => { setModalProductSearch(e.target.value); if (selectedProduct) setSelectedProduct(null) }}
                                        placeholder="Search product…"
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                </div>
                                {selectedProduct ? (
                                    <div className="flex items-center gap-3 px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-xl">
                                        <Image src={selectedProduct.images[0]} alt={selectedProduct.name} width={36} height={36} className="rounded-lg object-cover" />
                                        <span className="text-sm font-medium text-orange-800 flex-1 truncate">{selectedProduct.name}</span>
                                        <button type="button" onClick={() => { setSelectedProduct(null); setModalProductSearch('') }} className="text-orange-500 hover:text-orange-700">
                                            <XIcon size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                                        {modalProducts.length === 0 && <p className="text-sm text-slate-400 px-3 py-3">No products found</p>}
                                        {modalProducts.map(p => (
                                            <button
                                                key={p._id}
                                                type="button"
                                                onClick={() => { setSelectedProduct(p); setModalProductSearch(p.name) }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition text-left border-b border-slate-100 last:border-0"
                                            >
                                                <Image src={p.images[0]} alt={p.name} width={32} height={32} className="rounded-lg object-cover shrink-0" />
                                                <span className="text-sm text-slate-700 truncate">{p.name}</span>
                                                <span className="ml-auto text-xs text-slate-400 shrink-0">{p.rating.length} reviews</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Name & Email */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Name *</label>
                                    <input type="text" required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Email *</label>
                                    <input type="email" required value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="john@example.com" />
                                </div>
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Rating *</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })}>
                                            <StarIcon size={30} fill={formData.rating >= star ? "#F59E0B" : "#E5E7EB"} className="text-transparent hover:scale-110 transition" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Review */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Review *</label>
                                <textarea required value={formData.review} onChange={e => setFormData({ ...formData, review: e.target.value })} rows={4} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" placeholder="Write the customer's review…" />
                            </div>

                            {/* Images */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Images (Optional)</label>
                                <input type="file" accept="image/*" multiple onChange={e => setFormData({ ...formData, images: Array.from(e.target.files) })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 disabled:opacity-60 transition">
                                {submitting ? 'Submitting…' : 'Add Review'}
                            </button>
                            <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    )
}
