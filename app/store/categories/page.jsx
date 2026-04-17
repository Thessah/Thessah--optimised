'use client'

export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/useAuth'
import { PlusIcon, EditIcon, TrashIcon, FolderIcon, ImageIcon, XIcon, AlertTriangleIcon, CheckCircle2Icon } from 'lucide-react'
import { IKUpload } from 'imagekitio-next'



export default function StoreCategoriesPage() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        parentId: ''
    })
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState(null)
    const toastTimeoutRef = useRef(null)
    const { user, loading: authLoading, getToken } = useAuth();

    const showToast = (type, title, message) => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current)
        }

        setToast({ type, title, message })
        toastTimeoutRef.current = setTimeout(() => {
            setToast(null)
        }, 4500)
    }

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const token = await getToken(true); // Force refresh token
            if (!token) {
                console.error('No token available');
                setLoading(false);
                return;
            }
            const res = await fetch('/api/store/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.categories && Array.isArray(data.categories)) {
                setCategories(data.categories);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            fetchCategories();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user]);

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current)
            }
        }
    }, [])

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const url = editingCategory
                ? `/api/store/categories/${editingCategory._id}`
                : '/api/store/categories';

            const method = editingCategory ? 'PUT' : 'POST';
            const token = await getToken(true); // Force refresh token
            if (!token) {
                showToast('error', 'Authentication failed', 'Please sign in again and try once more.')
                setSubmitting(false);
                return;
            }
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                showToast(
                    'success',
                    editingCategory ? 'Category updated' : 'Category created',
                    editingCategory ? 'Your changes were saved successfully.' : 'The new category is ready to use.'
                )
                setShowModal(false);
                setEditingCategory(null);
                setFormData({ name: '', description: '', image: '', parentId: '' });
                fetchCategories();
            } else {
                showToast('error', 'Unable to save category', data.error || 'Failed to save category')
            }
        } catch (error) {
            console.error('Error saving category:', error);
            showToast('error', 'Unable to save category', 'Please try again in a moment.')
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const token = await getToken(true); // Force refresh token
            if (!token) {
                showToast('error', 'Authentication failed', 'Please sign in again and try once more.')
                return;
            }
            const res = await fetch(`/api/store/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();

            if (res.ok) {
                showToast('success', 'Category deleted', 'The category was removed successfully.')
                fetchCategories();
            } else {
                showToast('error', 'Unable to delete category', data.error || 'Failed to delete category')
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('error', 'Unable to delete category', 'Please try again in a moment.')
        }
    };

    // Handle edit
    const handleEdit = (category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            description: category.description || '',
            image: category.image || '',
            parentId: category.parentId || ''
        })
        setShowModal(true)
    }

    // Handle image upload success
    const onUploadSuccess = (res) => {
        setFormData(prev => ({ ...prev, image: res.url }))
        setUploading(false)
    }

    // Handle image upload error
    const onUploadError = (err) => {
        console.error('Upload error:', err)
        showToast('error', 'Image upload failed', 'Please try another image or retry the upload.')
        setUploading(false)
    }

    // Get parent categories (categories with no parent)
    const parentCategories = categories.filter(cat => !cat.parentId)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    return (
        <div className="p-6">
            {toast && (
                <div className="fixed right-4 top-4 z-[60] w-[calc(100vw-2rem)] max-w-sm">
                    <div
                        role="alert"
                        className={[
                            'overflow-hidden rounded-2xl border bg-white shadow-2xl backdrop-blur-sm',
                            toast.type === 'error'
                                ? 'border-red-200'
                                : 'border-emerald-200'
                        ].join(' ')}
                    >
                        <div className={toast.type === 'error' ? 'h-1.5 bg-red-500' : 'h-1.5 bg-emerald-500'} />
                        <div className="flex gap-3 p-4">
                            <div className={[
                                'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                                toast.type === 'error'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-emerald-50 text-emerald-600'
                            ].join(' ')}>
                                {toast.type === 'error' ? <AlertTriangleIcon size={18} /> : <CheckCircle2Icon size={18} />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                                <p className="mt-1 text-sm leading-5 text-gray-600">{toast.message}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setToast(null)}
                                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Dismiss notification"
                            >
                                <XIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                    <p className="text-gray-600 text-sm">Manage your product categories and subcategories</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCategory(null)
                        setFormData({ name: '', description: '', image: '', parentId: '' })
                        setShowModal(true)
                    }}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                    <PlusIcon size={20} />
                    Add Category
                </button>
            </div>

            {/* Categories List */}
            {parentCategories.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <FolderIcon size={64} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-xl text-gray-400 mb-2">No categories yet</p>
                    <p className="text-gray-500">Create your first category to get started</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {parentCategories.map(parent => (
                        <div key={parent._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            {/* Parent Category */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                                <div className="flex items-center gap-4">
                                    {parent.image ? (
                                        <img
                                            src={parent.image}
                                            alt={parent.name}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <FolderIcon size={32} className="text-gray-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">{parent.name}</h3>
                                        {parent.description && (
                                            <p className="text-sm text-gray-600">{parent.description}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(parent.children || []).length} subcategories
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(parent)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <EditIcon size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(parent._id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <TrashIcon size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Subcategories */}
                            {parent.children && parent.children.length > 0 && (
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {parent.children.map(child => (
                                        <div
                                            key={child._id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                {child.image ? (
                                                    <img
                                                        src={child.image}
                                                        alt={child.name}
                                                        className="w-10 h-10 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                        <FolderIcon size={20} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900">{child.name}</p>
                                                    {child.description && (
                                                        <p className="text-xs text-gray-500 line-clamp-1">{child.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(child)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    <EditIcon size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(child._id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <TrashIcon size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false)
                                    setEditingCategory(null)
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <XIcon size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="e.g., Electronics, Clothing"
                                />
                            </div>

                            {/* Parent Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Parent Category (Optional)
                                </label>
                                <select
                                    value={formData.parentId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="">None (Top Level)</option>
                                    {parentCategories
                                        .filter(cat => cat._id !== editingCategory?._id)
                                        .map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))
                                    }
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty to create a top-level category
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Brief description of this category"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category Image (Optional)
                                </label>
                                
                                {formData.image ? (
                                    <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                                        <img
                                            src={formData.image}
                                            alt="Category"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <XIcon size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        <ImageIcon size={40} className="mx-auto text-gray-400 mb-2" />
                                        <IKUpload
                                            fileName="category-image.jpg"
                                            onError={onUploadError}
                                            onSuccess={onUploadSuccess}
                                            onUploadStart={() => setUploading(true)}
                                            className="hidden"
                                            id="category-image-upload"
                                        />
                                        <label
                                            htmlFor="category-image-upload"
                                            className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                                        >
                                            {uploading ? 'Uploading...' : 'Upload Image'}
                                        </label>
                                        <p className="text-xs text-gray-500 mt-2">
                                            PNG, JPG up to 5MB
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        setEditingCategory(null)
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || uploading}
                                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
