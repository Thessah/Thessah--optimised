
'use client'
import { useAuth } from '@/lib/useAuth';

export const dynamic = 'force-dynamic'
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { fetchProducts as fetchProductsAction } from "@/lib/features/product/productSlice"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"

import axios from "axios"
import ProductForm from "../add-product/page"



export default function StoreManageProducts() {
    const dispatch = useDispatch();

    const { user, getToken } = useAuth();

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'AED'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [buyNowFilter, setBuyNowFilter] = useState('all')
    const [editingProduct, setEditingProduct] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)

    const filteredProducts = products.filter((product) => {
        const isBuyNowEnabled = product.showBuyButton !== false
        if (buyNowFilter === 'enabled') return isBuyNowEnabled
        if (buyNowFilter === 'disabled') return !isBuyNowEnabled
        return true
    })

    const fetchStoreProducts = async () => {
        try {
             const token = await getToken()
             const { data } = await axios.get('/api/store/product', {headers: { Authorization: `Bearer ${token}` } })
             setProducts(data.products.sort((a, b)=> new Date(b.createdAt) - new Date(a.createdAt)))
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const toggleStock = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/store/stock-toggle',{ productId }, {headers: { Authorization: `Bearer ${token}` } })
            setProducts(prevProducts => prevProducts.map(product =>  product._id === productId ? {...product, inStock: !product.inStock} : product))

            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const toggleFastDelivery = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/store/fast-delivery-toggle', { productId }, {headers: { Authorization: `Bearer ${token}` } })
            setProducts(prevProducts => prevProducts.map(product => 
                product._id === productId ? {...product, fastDelivery: !product.fastDelivery} : product
            ))
            toast.success(data.message)
            // Refresh global list so product pages see latest flags
            dispatch(fetchProductsAction({}))
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const toggleEnquiry = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/store/enquiry-toggle', { productId }, {headers: { Authorization: `Bearer ${token}` } })
            setProducts(prevProducts => prevProducts.map(product => 
                product._id === productId ? {...product, enableEnquiry: !product.enableEnquiry} : product
            ))
            toast.success(data.message)
            // Refresh global list so product pages see latest flags
            dispatch(fetchProductsAction({}))
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const toggleBuyNow = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/store/buy-now-toggle', { productId }, {headers: { Authorization: `Bearer ${token}` } })
            setProducts(prevProducts => prevProducts.map(product =>
                product._id === productId ? {...product, showBuyButton: !product.showBuyButton} : product
            ))
            toast.success(data.message)
            // Refresh global list so product pages see latest flags
            dispatch(fetchProductsAction({}))
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const handleEdit = (product) => {
        setEditingProduct(product)
        setShowEditModal(true)
    }

    const handleDelete = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return
        
        try {
            const token = await getToken()
            await axios.delete(`/api/store/product?productId=${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(prevProducts => prevProducts.filter(p => p._id !== productId))
            toast.success('Product deleted successfully')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const handleUpdateSuccess = (updatedProduct) => {
        setProducts(prevProducts => prevProducts.map(p => 
            p._id === updatedProduct._id ? updatedProduct : p
        ))
        setShowEditModal(false)
        setEditingProduct(null)
        // Refresh global Redux product list so frontend always uses latest slug
        dispatch(fetchProductsAction({}));
    }

    useEffect(() => {
        if(user){
            fetchStoreProducts()
        }  
    }, [user])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => setBuyNowFilter('all')}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition ${buyNowFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                >
                    All ({products.length})
                </button>
                <button
                    onClick={() => setBuyNowFilter('enabled')}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition ${buyNowFilter === 'enabled' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                >
                    Buy Now On ({products.filter((p) => p.showBuyButton !== false).length})
                </button>
                <button
                    onClick={() => setBuyNowFilter('disabled')}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition ${buyNowFilter === 'disabled' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                >
                    Buy Now Off ({products.filter((p) => p.showBuyButton === false).length})
                </button>
            </div>
            <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
                <table className="min-w-[1160px] w-full text-left text-sm">
                    <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 w-[240px]">Name</th>
                            <th className="px-4 py-3 hidden lg:table-cell w-[120px]">SKU</th>
                            <th className="px-4 py-3 hidden md:table-cell w-[260px]">Description</th>
                            <th className="px-4 py-3 hidden md:table-cell w-[120px] text-right">AED</th>
                            <th className="px-4 py-3 w-[120px] text-right">Price</th>
                            <th className="px-4 py-3 w-[140px]">Category</th>
                            <th className="px-4 py-3 hidden sm:table-cell w-[120px] text-center">Fast Delivery</th>
                            <th className="px-4 py-3 hidden sm:table-cell w-[110px] text-center">Enquiry</th>
                            <th className="px-4 py-3 hidden sm:table-cell w-[120px] text-center">Buy Now</th>
                            <th className="px-4 py-3 w-[90px] text-center">Stock</th>
                            <th className="px-4 py-3 w-[140px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {filteredProducts.map((product, idx) => (
                            <tr key={product._id} className={`border-t border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} hover:bg-gray-50`}>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 items-center min-w-[220px]">
                                        <Image
                                            width={40}
                                            height={40}
                                            className="p-1 shadow rounded bg-white object-cover"
                                            src={product.images?.[0] || 'https://ik.imagekit.io/jrstupuke/placeholder.png'}
                                            alt={product.name}
                                        />
                                        <span className="font-medium text-slate-900 truncate block">{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{product.sku || '-'}</td>
                                <td className="px-4 py-3 max-w-md text-slate-600 hidden md:table-cell truncate">
                                    {product.description?.replace(/<[^>]*>/g, ' ').trim().substring(0, 100)}...
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell text-right">{currency} {product.AED.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right">{currency} {product.price.toLocaleString()}</td>
                                <td className="px-4 py-3">{product.category || '-'}</td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            onChange={() => toast.promise(toggleFastDelivery(product._id), { loading: "Updating..." })}
                                            checked={product.fastDelivery || false}
                                        />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                    </label>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            onChange={() => toast.promise(toggleEnquiry(product._id), { loading: "Updating..." })}
                                            checked={product.enableEnquiry || false}
                                        />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-purple-600 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                    </label>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            onChange={() => toast.promise(toggleBuyNow(product._id), { loading: "Updating..." })}
                                            checked={product.showBuyButton !== false}
                                        />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-indigo-600 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                    </label>
                                </td>
                                <td className="px-4 py-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product._id), { loading: "Updating..." })} checked={product.inStock} />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                    </label>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                                    No products found for this Buy Now filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showEditModal && (
                <ProductForm 
                    product={editingProduct}
                    onClose={() => {
                        setShowEditModal(false)
                        setEditingProduct(null)
                    }}
                    onSubmitSuccess={handleUpdateSuccess}
                />
            )}
        </>
    )
}