'use client'
import { assets } from "@/assets/assets"

import axios from "axios"
import Image from "next/image"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Node, mergeAttributes } from '@tiptap/core'

import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

import { useAuth } from '@/lib/useAuth';

// Custom Video Extension for Tiptap
const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
      width: {
        default: '100%',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: true })]
  },

  addCommands() {
    return {
      setVideo: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})

export const dynamic = 'force-dynamic'

export default function ProductForm({ product = null, onClose, onSubmitSuccess }) {
    const router = useRouter()
    const [dbCategories, setDbCategories] = useState([])
    const colorOptions = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Purple']
    const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL']

    const [images, setImages] = useState({ "1": null, "2": null, "3": null, "4": null, "5": null, "6": null, "7": null, "8": null })
    const [productInfo, setProductInfo] = useState({
        name: "",
        slug: "",
        brand: "",
        shortDescription: "",
        description: "",
        AED: "",
        price: "",
        category: "",
        sku: "",
        stockQuantity: '',
        colors: [],
        sizes: [],
        fastDelivery: false,
        allowReturn: true,
        allowReplacement: true,
        enquiryOnly: false,
        reviews: [],
        badges: [], // Array of badge labels like "Price Lower Than Usual", "Hot Deal", etc.
        tags: []
    })
    // Variants state
    const [hasVariants, setHasVariants] = useState(false)
    const [variants, setVariants] = useState([]) // { options: {color, size[, bundleQty]}, price, AED, stock, sku?, tag? }
    // Bulk bundle variant helper state (UI sugar over variants JSON)
    const [bulkEnabled, setBulkEnabled] = useState(false)
    const [bulkOptions, setBulkOptions] = useState([
        { title: 'Buy 1', qty: 1, price: '', AED: '', stock: 0, tag: '' },
        { title: 'Bundle of 2', qty: 2, price: '', AED: '', stock: 0, tag: 'MOST_POPULAR' },
        { title: 'Bundle of 3', qty: 3, price: '', AED: '', stock: 0, tag: '' },
    ])
    const [reviewInput, setReviewInput] = useState({ name: "", rating: 5, comment: "", image: null })
    const [loading, setLoading] = useState(false)

    // Dynamic details (Metal / General)
    const [metalDetails, setMetalDetails] = useState([]) // [{label, value}]
    const [generalDetails, setGeneralDetails] = useState([]) // [{label, value}]


    const { user, loading: authLoading, getToken } = useAuth();

    // Fetch categories from database
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/store/categories');
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error('Failed to fetch categories:', res.status, res.statusText, errorData);
                    return;
                }
                
                const data = await res.json();
                if (data.categories) {
                    setDbCategories(data.categories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                // Set empty array as fallback
                setDbCategories([]);
            }
        };
        // Fetch categories immediately without waiting for auth
        fetchCategories();
    }, []);

    // Tiptap editor for description
    const editor = useEditor({
        extensions: [
            StarterKit,
            TiptapImage.configure({
                inline: true,
                allowBase64: true,
            }),
            Video,
            Link.configure({ openOnClick: false }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({
                placeholder: 'Write a detailed product description... Use the toolbar to format text, add images, videos, links, tables and more!'
            })
        ],
        content: productInfo.description,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            setProductInfo(prev => ({ ...prev, description: editor.getHTML() }))
        }
    })

    // Update editor content when product changes
    useEffect(() => {
        if (editor && product?.description) {
            // Use setTimeout to ensure editor is ready
            setTimeout(() => {
                if (editor.getHTML() !== product.description) {
                    editor.commands.setContent(product.description, false)
                }
            }, 100)
        }
    }, [product?.description, editor])

    // Prefill form when editing
    useEffect(() => {
        if (product) {
            setProductInfo({
                name: product.name || "",
                slug: product.slug || "",
                brand: product.brand || "",
                shortDescription: product.shortDescription || "",
                description: product.description || "",
                AED: product.AED || "",
                price: product.price || "",
                category: product.category || "",
                sku: product.sku || "",
                stockQuantity: product.stockQuantity ?? '',
                colors: product.colors || [],
                sizes: product.sizes || [],
                fastDelivery: product.fastDelivery || false,
                allowReturn: product.allowReturn !== undefined ? product.allowReturn : true,
                allowReplacement: product.allowReplacement !== undefined ? product.allowReplacement : true,
                reviews: product.reviews || [],
                badges: product.attributes?.badges || [],
                tags: product.tags || []
            })
            const pv = Array.isArray(product.variants) ? product.variants : []
            setHasVariants(Boolean(product.hasVariants))
            setVariants(pv)
            // Detect bulk bundle style variants (presence of options.bundleQty)
            const isBulk = pv.length > 0 && pv.every(v => v?.options && (v.options.bundleQty || v.options.bundleQty === 0) && !v.options.color && !v.options.size)
            if (isBulk) {
                setBulkEnabled(true)
                // Map into editable bulkOptions
                const mapped = pv.map(v => ({
                    title: v?.options?.title || (Number(v?.options?.bundleQty) === 1 ? 'Buy 1' : `Bundle of ${Number(v?.options?.bundleQty) || 1}`),
                    qty: Number(v?.options?.bundleQty) || 1,
                    price: v.price ?? '',
                    AED: v.AED ?? v.price ?? '',
                    stock: v.stock ?? 0,
                    tag: v.tag || v.options?.tag || ''
                }))
                // Keep sorted by qty
                mapped.sort((a,b)=>a.qty-b.qty)
                setBulkOptions(mapped)
            }
            // Map existing images to slots - store as strings (URLs)
            const imgState = { "1": null, "2": null, "3": null, "4": null, "5": null, "6": null, "7": null, "8": null }
            if (product.images && Array.isArray(product.images)) {
                product.images.forEach((img, i) => {
                    if (i < 8) imgState[String(i + 1)] = img // Keep as string URL
                })
            }
            setImages(imgState)

            // Prefill dynamic details from product or local overrides
            try {
                const map = JSON.parse(localStorage.getItem('productDetailsOverrides') || '{}')
                const override = product._id ? map[product._id] : null
                setMetalDetails(Array.isArray(product.metalDetails) && product.metalDetails.length ? product.metalDetails : (override?.metalDetails || []))
                setGeneralDetails(Array.isArray(product.generalDetails) && product.generalDetails.length ? product.generalDetails : (override?.generalDetails || []))
            } catch {}
        }
    }, [product])

    const updateDetail = (setter) => (idx, field, val) => {
        setter(prev => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)))
    }
    const addDetailRow = (setter) => () => setter(prev => [...prev, { label: '', value: '' }])
    const removeDetailRow = (setter) => (idx) => setter(prev => prev.filter((_, i) => i !== idx))

    const onChangeHandler = (e) => {
        const { name, value } = e.target
        
        // Auto-generate slug from product name
        if (name === 'name') {
            const slug = value
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
            
            setProductInfo(prev => ({ 
                ...prev, 
                [name]: value,
                slug: slug 
            }))
        } else {
            setProductInfo(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleImageUpload = async (key, file) => {
        // Create preview URL for the file
        const previewUrl = URL.createObjectURL(file)
        setImages(prev => ({ ...prev, [key]: { file, preview: previewUrl } }))
    }

    const handleImageDelete = async (key) => {
        setImages(prev => {
            const updated = { ...prev, [key]: null };

            // If editing an existing product, persist the change
            if (product && product._id) {
                // Collect all non-null images (string URLs only)
                const newImages = Object.values(updated)
                    .filter(img => typeof img === 'string' && img)
                ;
                (async () => {
                    try {
                        const token = await getToken();
                        await axios.put('/api/store/product', {
                            productId: product._id,
                            images: newImages
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        toast.success('Image deleted and saved!');
                    } catch (err) {
                        toast.error('Failed to delete image on server');
                    }
                })();
            }
            return updated;
        });
    }

    const addReview = () => {
        if (!reviewInput.name || !reviewInput.comment) return toast.error("Please fill all review fields")
        setProductInfo(prev => ({ ...prev, reviews: [...prev.reviews, reviewInput] }))
        setReviewInput({ name: "", rating: 5, comment: "", image: null })
        toast.success("Review added ✅")
    }

    const removeReview = (index) => {
        setProductInfo(prev => ({ ...prev, reviews: prev.reviews.filter((_, i) => i !== index) }))
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        try {
            const hasImage = Object.values(images).some(img => img)
            if (!hasImage) return toast.error('Please upload at least one product image')

            setLoading(true)
            const formData = new FormData()

            Object.entries(productInfo).forEach(([key, value]) => {
                if (["colors", "sizes"].includes(key)) {
                    formData.append(key, JSON.stringify(value))
                } else if (key === 'reviews') {
                    const cleanReviews = value.map(({ name, rating, comment }) => ({ name, rating, comment }))
                    formData.append('reviews', JSON.stringify(cleanReviews))
                } else if (key === 'tags') {
                    formData.append('tags', JSON.stringify(value))
                } else if (key === 'slug') {
                    formData.append('slug', value.trim())
                } else {
                    formData.append(key, value)
                }
            })

            // Attributes bucket for extra details
            const attributes = {
                brand: productInfo.brand,
                shortDescription: productInfo.shortDescription,
                badges: productInfo.badges || [],
                ...(bulkEnabled ? { variantType: 'bulk_bundles' } : {})
            }
            // Include dynamic details for future server support
            attributes.metalDetails = metalDetails
            attributes.generalDetails = generalDetails
            formData.append('attributes', JSON.stringify(attributes))

            // Also send as top-level fields (API may accept these directly)
            formData.append('metalDetails', JSON.stringify(metalDetails))
            formData.append('generalDetails', JSON.stringify(generalDetails))

            // Variants
            let variantsToSend = variants
            let hasVariantsFlag = hasVariants
            if (bulkEnabled) {
                // project bulkOptions -> variants array in common shape
                variantsToSend = bulkOptions
                    .filter(b => Number(b.qty) > 0 && Number(b.price) > 0)
                    .map(b => ({
                        options: { bundleQty: Number(b.qty), title: (b.title || undefined), tag: b.tag || undefined },
                        price: Number(b.price),
                        AED: Number(b.AED || b.price),
                        stock: Number(b.stock || 0),
                    }))
                hasVariantsFlag = variantsToSend.length > 0
                
                // Ensure base price/AED are set from the first bulk option for API validation
                if (variantsToSend.length > 0 && (!productInfo.price || !productInfo.AED)) {
                    formData.set('price', String(variantsToSend[0].price))
                    formData.set('AED', String(variantsToSend[0].AED))
                }
            }
            formData.append('hasVariants', String(hasVariantsFlag))
            if (hasVariantsFlag) {
                formData.append('variants', JSON.stringify(variantsToSend))
            }

            Object.keys(images).forEach(key => {
                const img = images[key]
                if (img) {
                    // If it's an object with file property (new upload), use the file
                    // If it's a string (existing image URL), append as 'images' too
                    if (img.file) {
                        formData.append('images', img.file)
                    } else if (typeof img === 'string') {
                        formData.append('images', img)
                    }
                }
            })

            productInfo.reviews.forEach((rev, index) => {
                if (rev.image) formData.append(`reviewImages_${index}`, rev.image)
            })

            // Add productId for edit mode
            if (product?._id) {
                formData.append('productId', product._id)
            }

            let token = await getToken()
            // Retry once with forceRefresh to handle expired tokens
            if (!token) {
                token = await getToken(true)
            }
            if (!token) {
                toast.error('Authentication required. Please sign in again.')
                setLoading(false)
                return
            }
            const apiCall = product
                ? axios.put(`/api/store/product`, formData, { headers: { Authorization: `Bearer ${token}` } })
                : axios.post('/api/store/product', formData, { headers: { Authorization: `Bearer ${token}` } })

            const { data } = await apiCall
            toast.success(data.message)
            // Call success callback if provided
            if (onSubmitSuccess) {
                onSubmitSuccess(data.product || data.updatedProduct)
            }
            // Persist dynamic details to localStorage overrides so ProductDetails can read them
            try {
                const saved = data.product || data.updatedProduct || product
                if (saved && saved._id) {
                    const map = JSON.parse(localStorage.getItem('productDetailsOverrides') || '{}')
                    map[saved._id] = { metalDetails, generalDetails }
                    localStorage.setItem('productDetailsOverrides', JSON.stringify(map))
                }
            } catch {}
            // Always close modal (if any) and navigate to manage-product
            if (onClose) {
                onClose()
            }
            router.push('/store/manage-product')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">
                Checking session...
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-6 py-4 text-center shadow-sm">
                    <p className="text-sm font-semibold text-amber-800">Session expired. Please sign in again to add products.</p>
                    <div className="mt-3 flex justify-center">
                        <button
                            onClick={() => router.push('/login')}
                            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Check if this is being used as a modal (when onClose is provided)
    const isModal = !!onClose

    return (
        <div className={isModal ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" : "min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4"}>
            <div className={isModal ? "w-full max-w-4xl my-8 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto" : "max-w-6xl mx-auto"}>
                <form onSubmit={onSubmitHandler} className={isModal ? "space-y-6 p-8" : "space-y-8"}>
                    {/* Header */}
                    <div className={isModal ? "flex items-center justify-between mb-6 pb-4 border-b border-slate-200" : "flex items-center justify-between mb-8"}>
                        <div>
                            <h1 className={isModal ? "text-2xl font-bold text-slate-900" : "text-4xl font-bold text-slate-900"}>{product ? "Edit Product" : "Add New Product"}</h1>
                            {!isModal && <p className="text-slate-600 mt-2">Manage your jewelry inventory with ease</p>}
                        </div>
                        <button 
                            type="button" 
                            onClick={() => onClose ? onClose() : router.back()} 
                            className="text-slate-600 hover:text-slate-900 text-2xl"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Section 1: Basic Info */}
                    <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">1</span>
                            Product Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</label>
                                <input name="name" value={productInfo.name} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="Enter product name" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Brand</label>
                                <input name="brand" value={productInfo.brand} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="Brand (optional)" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
                                <select name="category" value={productInfo.category} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition">
                                    <option value="">Select category</option>
                                    {dbCategories.map(cat => {
                                        if (!cat.parentId) {
                                            return [
                                                <option key={cat._id} value={cat.name} className="font-semibold">
                                                    {cat.name}
                                                </option>,
                                                ...cat.children.map(child => (
                                                    <option key={child._id} value={child.name} className="pl-4">
                                                        &nbsp;&nbsp;&nbsp;&nbsp;{child.name}
                                                    </option>
                                                ))
                                            ]
                                        }
                                        return null
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">SKU</label>
                                <input name="sku" value={productInfo.sku || ""} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="Stock Keeping Unit (optional)" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Stock Quantity *</label>
                                <input 
                                    type="number" 
                                    name="stockQuantity" 
                                    value={productInfo.stockQuantity ?? ''} 
                                    onChange={onChangeHandler} 
                                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
                                    placeholder="0" 
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Slug <span className="text-xs font-normal text-green-600">(auto-generated)</span></label>
                                <input 
                                    name="slug" 
                                    value={productInfo.slug} 
                                    readOnly 
                                    className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 bg-slate-50 text-slate-600 cursor-not-allowed" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Pricing */}
                    <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-green-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">2</span>
                            Pricing
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Regular Price (AED) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">AED</span>
                                    <input type="number" step="0.01" name="AED" value={productInfo.AED} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 pl-16 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Sale Price (AED) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">AED</span>
                                    <input type="number" step="0.01" name="price" value={productInfo.price} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 pl-16 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" placeholder="0.00" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Descriptions & Tags */}
                    <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-purple-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">3</span>
                            Description & Tags
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Short Description</label>
                                <input name="shortDescription" value={productInfo.shortDescription} onChange={onChangeHandler} className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition" placeholder="Brief overview (e.g., Gold Necklace for Wedding)" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                                <div className="flex gap-2 mb-3 flex-wrap">
                                    {productInfo.tags.map((tag, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                                            {tag}
                                            <button type="button" className="text-purple-500 hover:text-purple-700 font-bold" onClick={() => setProductInfo(p=>({ ...p, tags: p.tags.filter((_,i)=>i!==idx) }))}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        id="tagInput"
                                        className="flex-1 border-2 border-slate-200 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
                                        placeholder="Type tag (Gold, Earrings, etc.) and press Enter"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ',') {
                                                e.preventDefault();
                                                const val = e.currentTarget.value.trim();
                                                if (val && !productInfo.tags.includes(val)) {
                                                    setProductInfo(p=>({ ...p, tags: [...p.tags, val] }));
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition"
                                        onClick={() => {
                                            const el = document.getElementById('tagInput');
                                            if (el && typeof el.value === 'string') {
                                                const val = el.value.trim();
                                                if (val && !productInfo.tags.includes(val)) {
                                                    setProductInfo(p=>({ ...p, tags: [...p.tags, val] }));
                                                    el.value = '';
                                                }
                                            }
                                        }}
                                    >Add</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Product Badges & Features */}
                    <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-amber-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm">4</span>
                            Features & Options
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">Badges (Optional)</label>
                                <div className="flex flex-wrap gap-3">
                                    {['Price Lower Than Usual', 'Hot Deal', 'Best Seller', 'New Arrival', 'Limited Stock', 'Free Shipping'].map((badge) => (
                                        <button
                                            key={badge}
                                            type="button"
                                            onClick={() => {
                                                if (productInfo.badges.includes(badge)) {
                                                    setProductInfo(prev => ({ ...prev, badges: prev.badges.filter(b => b !== badge) }))
                                                } else {
                                                    setProductInfo(prev => ({ ...prev, badges: [...prev.badges, badge] }))
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                                productInfo.badges.includes(badge)
                                                    ? 'bg-amber-500 text-white shadow-lg'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                        >
                                            {productInfo.badges.includes(badge) ? '✓ ' : ''}{badge}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-amber-500 cursor-pointer transition">
                                    <input type="checkbox" checked={productInfo.fastDelivery} onChange={(e)=> setProductInfo(p=>({...p, fastDelivery: e.target.checked}))} className="w-5 h-5" />
                                    <span className="font-medium text-slate-700">🚚 Fast Delivery</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-amber-500 cursor-pointer transition">
                                    <input type="checkbox" checked={productInfo.allowReturn} onChange={(e)=> setProductInfo(p=>({...p, allowReturn: e.target.checked}))} className="w-5 h-5" />
                                    <span className="font-medium text-slate-700">↩️ 7-Day Return</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-amber-500 cursor-pointer transition">
                                    <input type="checkbox" checked={productInfo.allowReplacement} onChange={(e)=> setProductInfo(p=>({...p, allowReplacement: e.target.checked}))} className="w-5 h-5" />
                                    <span className="font-medium text-slate-700">🔄 7-Day Replacement</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-amber-500 cursor-pointer transition">
                                    <input type="checkbox" checked={productInfo.enquiryOnly} onChange={(e)=> setProductInfo(p=>({...p, enquiryOnly: e.target.checked}))} className="w-5 h-5" />
                                    <span className="font-medium text-slate-700">❓ Enquiry Only</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Product Details */}
                    <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-rose-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-sm">5</span>
                            Jewelry Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-rose-600">💎 Metal Details</h3>
                                    <button type="button" className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-sm font-semibold transition" onClick={addDetailRow(setMetalDetails)}>+ Add</button>
                                </div>
                                <div className="space-y-3">
                                    {metalDetails.map((it, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="Label" value={it.label} onChange={(e)=>updateDetail(setMetalDetails)(idx,'label', e.target.value)} />
                                            <input className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="Value" value={it.value} onChange={(e)=>updateDetail(setMetalDetails)(idx,'value', e.target.value)} />
                                            <button type="button" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition" onClick={()=>removeDetailRow(setMetalDetails)(idx)}>✕</button>
                                        </div>
                                    ))}
                                    {metalDetails.length === 0 && (
                                        <p className="text-sm text-slate-500 italic">No metal details added yet. Add details like Karatage, Color, Metal type.</p>
                                    )}
                                </div>
                            </section>
                            <section className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-rose-600">✨ General Details</h3>
                                    <button type="button" className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-sm font-semibold transition" onClick={addDetailRow(setGeneralDetails)}>+ Add</button>
                                </div>
                                <div className="space-y-3">
                                    {generalDetails.map((it, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="Label" value={it.label} onChange={(e)=>updateDetail(setGeneralDetails)(idx,'label', e.target.value)} />
                                            <input className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition" placeholder="Value" value={it.value} onChange={(e)=>updateDetail(setGeneralDetails)(idx,'value', e.target.value)} />
                                            <button type="button" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition" onClick={()=>removeDetailRow(setGeneralDetails)(idx)}>✕</button>
                                        </div>
                                    ))}
                                    {generalDetails.length === 0 && (
                                        <p className="text-sm text-slate-500 italic">No general details added yet. Add details like Type, Brand, Collection, Gender, Occasion.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Section 6: Rich Description */}
                    <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-indigo-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm">6</span>
                            Detailed Description
                        </h2>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Rich Text Editor</label>
                        
                        {/* Toolbar */}
                        <div className="border-2 border-slate-200 rounded-t-lg bg-slate-50 p-4 flex flex-wrap gap-2">
                            <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={`px-3 py-2 rounded font-bold transition ${editor?.isActive('bold') ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Bold">B</button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`px-3 py-2 rounded italic transition ${editor?.isActive('italic') ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Italic">I</button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} className={`px-3 py-2 rounded line-through transition ${editor?.isActive('strike') ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Strikethrough">S</button>
                            <div className="w-px bg-slate-300 self-center mx-1"></div>
                            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-3 py-2 rounded font-bold transition ${editor?.isActive('heading', { level: 1 }) ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Heading 1">H1</button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-3 py-2 rounded font-bold transition ${editor?.isActive('heading', { level: 2 }) ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Heading 2">H2</button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`px-3 py-2 rounded transition ${editor?.isActive('bulletList') ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Bullet List">• List</button>
                            <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`px-3 py-2 rounded transition ${editor?.isActive('orderedList') ? 'bg-indigo-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'}`} title="Ordered List">1. List</button>
                            <div className="w-px bg-slate-300 self-center mx-1"></div>
                            <label className="px-3 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold cursor-pointer transition flex items-center gap-1" title="Upload Image">
                                🖼️ Image
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return
                                        try {
                                            const formData = new FormData()
                                            formData.append('image', file)
                                            const token = await getToken()
                                            const { data } = await axios.post('/api/store/upload-image', formData, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            })
                                            editor?.chain().focus().setImage({ src: data.url }).run()
                                            toast.success('Image uploaded!')
                                        } catch (error) {
                                            toast.error('Failed to upload image')
                                        }
                                        e.target.value = ''
                                    }}
                                />
                            </label>
                            <label className="px-3 py-2 rounded bg-purple-500 hover:bg-purple-600 text-white font-semibold cursor-pointer transition flex items-center gap-1" title="Upload Video">
                                🎥 Video
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    className="hidden" 
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return
                                        if (file.size > 50 * 1024 * 1024) {
                                            toast.error('Video file too large (max 50MB)')
                                            return
                                        }
                                        try {
                                            toast.loading('Uploading video...')
                                            const formData = new FormData()
                                            formData.append('image', file)
                                            const token = await getToken()
                                            const { data } = await axios.post('/api/store/upload-image', formData, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            })
                                            editor?.chain().focus().setVideo({ src: data.url }).run()
                                            toast.dismiss()
                                            toast.success('Video uploaded!')
                                        } catch (error) {
                                            toast.dismiss()
                                            toast.error('Failed to upload video')
                                        }
                                        e.target.value = ''
                                    }}
                                />
                            </label>
                            <input type="color" onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()} className="w-10 h-10 rounded cursor-pointer" title="Text Color" />
                        </div>
                        
                        {/* Editor */}
                        <EditorContent 
                            editor={editor} 
                            className="border-2 border-t-0 border-slate-200 rounded-b-lg bg-white p-6 min-h-[300px] max-h-[600px] overflow-y-auto prose prose-slate max-w-none focus-within:ring-2 focus-within:ring-indigo-500 transition-all [&_video]:max-w-full [&_video]:rounded [&_video]:my-4 [&_img]:max-w-full [&_img]:rounded [&_img]:my-2"
                        />
                    </div>

                    {/* Section 7: Product Images */}
                    <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-cyan-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-cyan-500 text-white px-3 py-1 rounded-full text-sm">7</span>
                            Product Images
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.keys(images).map((key) => {
                                const img = images[key]
                                const hasImage = img && (img.preview || typeof img === 'string')
                                return (
                                    <div key={key} className="relative border-4 border-dashed border-slate-300 hover:border-cyan-500 rounded-lg flex items-center justify-center h-40 cursor-pointer bg-slate-50 hover:bg-slate-100 overflow-hidden group transition">
                                        <label className="absolute inset-0 w-full h-full cursor-pointer">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e)=> e.target.files && handleImageUpload(key, e.target.files[0])} />
                                            {hasImage ? (
                                                <>
                                                    <Image 
                                                        src={img.preview || img} 
                                                        alt={`Product ${key}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white font-semibold">Change Image</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center">
                                                    <span className="text-2xl">📷</span>
                                                    <p className="text-slate-600 text-sm font-medium mt-1">Image {key}</p>
                                                </div>
                                            )}
                                        </label>
                                        {hasImage && (
                                            <button
                                                type="button"
                                                onClick={() => handleImageDelete(key)}
                                                className="absolute top-2 right-2 z-10 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
                                                title="Delete image"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Section 8: Variants */}
                    {(hasVariants || bulkEnabled) && (
                    <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-teal-500">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span className="bg-teal-500 text-white px-3 py-1 rounded-full text-sm">8</span>
                            Product Variants
                        </h2>
                        {bulkEnabled && (
                            <div className="space-y-4">
                                <div className="text-sm text-slate-600 bg-teal-50 p-3 rounded">Configure bundle quantities and pricing.</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-slate-300">
                                                <th className="text-left px-4 py-2 font-semibold text-slate-700">Label</th>
                                                <th className="text-left px-4 py-2 font-semibold text-slate-700">Qty</th>
                                                <th className="text-left px-4 py-2 font-semibold text-slate-700">Price</th>
                                                <th className="text-left px-4 py-2 font-semibold text-slate-700">AED</th>
                                                <th className="text-left px-4 py-2 font-semibold text-slate-700">Stock</th>
                                                <th className="text-left px-4 py-2 font-semibold text-slate-700">Tag</th>
                                                <th className="text-center px-4 py-2 font-semibold text-slate-700">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bulkOptions.map((b, idx)=> (
                                                <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                                                    <td className="px-4 py-2"><input className="w-full border border-slate-300 rounded px-2 py-1" placeholder="Label" value={b.title || ''} onChange={(e)=>{ const v=[...bulkOptions]; v[idx] = { ...b, title: e.target.value }; setBulkOptions(v)}} /></td>
                                                    <td className="px-4 py-2"><input className="w-full border border-slate-300 rounded px-2 py-1" type="number" min={1} value={b.qty} onChange={(e)=>{ const v=[...bulkOptions]; v[idx] = { ...b, qty: Number(e.target.value) }; setBulkOptions(v)}} /></td>
                                                    <td className="px-4 py-2"><input className="w-full border border-slate-300 rounded px-2 py-1" type="number" step="0.01" value={b.price} onChange={(e)=>{ const v=[...bulkOptions]; v[idx] = { ...b, price: e.target.value }; setBulkOptions(v)}} /></td>
                                                    <td className="px-4 py-2"><input className="w-full border border-slate-300 rounded px-2 py-1" type="number" step="0.01" value={b.AED} onChange={(e)=>{ const v=[...bulkOptions]; v[idx] = { ...b, AED: e.target.value }; setBulkOptions(v)}} /></td>
                                                    <td className="px-4 py-2"><input className="w-full border border-slate-300 rounded px-2 py-1" type="number" value={b.stock} onChange={(e)=>{ const v=[...bulkOptions]; v[idx] = { ...b, stock: Number(e.target.value) }; setBulkOptions(v)}} /></td>
                                                    <td className="px-4 py-2"><select className="w-full border border-slate-300 rounded px-2 py-1" value={b.tag} onChange={(e)=>{ const v=[...bulkOptions]; v[idx] = { ...b, tag: e.target.value }; setBulkOptions(v)}}><option value="">None</option><option value="MOST_POPULAR">Most Popular</option><option value="BEST_VALUE">Best Value</option></select></td>
                                                    <td className="px-4 py-2 text-center"><button type="button" className="text-red-600 hover:text-red-800 font-bold" onClick={()=> setBulkOptions(bulkOptions.filter((_,i)=>i!==idx))}>✕</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button type="button" className="text-teal-600 hover:text-teal-700 font-semibold" onClick={()=> setBulkOptions([...bulkOptions, { title: '', qty: 1, price: '', AED: '', stock: 0, tag: '' }])}>+ Add Bundle</button>
                            </div>
                        )}
                        {hasVariants && !bulkEnabled && (
                            <div className="space-y-6">
                                {variants.map((v, idx) => (
                                    <div key={idx} className="border-2 border-slate-200 rounded-lg p-6 bg-slate-50 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-slate-900">Variant #{idx + 1}</h4>
                                            <button type="button" className="text-red-600 hover:text-red-800 font-bold" onClick={()=>setVariants(variants.filter((_,i)=>i!==idx))}>✕ Remove</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input className="border-2 border-slate-200 rounded-lg px-3 py-2" placeholder="Title" value={v.options?.title || ''} onChange={(e)=>{ const nv=[...variants]; nv[idx]={...v, options:{...(v.options||{}), title:e.target.value}}; setVariants(nv)}} />
                                            <input className="border-2 border-slate-200 rounded-lg px-3 py-2" placeholder="SKU" value={v.sku || ''} onChange={(e)=>{ const nv=[...variants]; nv[idx]={...v, sku:e.target.value}; setVariants(nv)}} />
                                            <input className="border-2 border-slate-200 rounded-lg px-3 py-2" placeholder="Color" value={v.options?.color || ''} onChange={(e)=>{ const nv=[...variants]; nv[idx]={...v, options:{...(v.options||{}), color:e.target.value}}; setVariants(nv)}} />
                                            <input className="border-2 border-slate-200 rounded-lg px-3 py-2" placeholder="Size" value={v.options?.size || ''} onChange={(e)=>{ const nv=[...variants]; nv[idx]={...v, options:{...(v.options||{}), size:e.target.value}}; setVariants(nv)}} />
                                            <input className="border-2 border-slate-200 rounded-lg px-3 py-2" type="number" placeholder="Stock" value={v.stock ?? 0} onChange={(e)=>{ const nv=[...variants]; nv[idx]={...v, stock:Number(e.target.value)}; setVariants(nv)}} />
                                            <input className="border-2 border-slate-200 rounded-lg px-3 py-2" type="number" step="0.01" placeholder="Price (AED)" value={v.price ?? ''} onChange={(e)=>{ const nv=[...variants]; nv[idx]={...v, price:Number(e.target.value)}; setVariants(nv)}} />
                                            <input className="border-2 border-slate-200 rounded-lg px-3 py-2" type="number" step="0.01" placeholder="AED (AED)" value={v.AED ?? ''} onChange={(e)=>{ const nv=[...variants]; nv[idx]={...v, AED:Number(e.target.value)}; setVariants(nv)}} />
                                        </div>
                                    </div>
                                ))}
                                <button type="button" className="w-full px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition" onClick={()=> setVariants([...variants, { options:{}, price:0, AED:0, stock:0, sku:'' }])}>+ Add Variant</button>
                            </div>
                        )}
                    </div>
                    )}

                    {/* Actions */}
                    <div className={isModal ? "flex gap-3 pt-6 border-t border-slate-200" : "flex gap-4 sticky bottom-0 bg-gradient-to-t from-white to-white/80 pt-6 -mx-8 px-8 py-6"}>
                        <button disabled={loading} className={isModal ? "flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition" : "flex-1 px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 text-white rounded-lg font-bold text-lg transition shadow-lg"}>
                            {loading ? '⏳ Processing...' : (product ? "✓ Update Product" : "✓ Add Product")}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => onClose ? onClose() : router.back()} 
                            className={isModal ? "px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition" : "px-8 py-4 bg-slate-300 hover:bg-slate-400 text-slate-900 rounded-lg font-bold transition"}
                        >
                            ✕ Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
