"use client"
import { usePathname } from "next/navigation"
import { HomeIcon, LayoutListIcon, SquarePenIcon, SquarePlusIcon, StarIcon, FolderIcon, TicketIcon, TruckIcon, RefreshCw, User as UserIcon, Users as UsersIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import axios from "axios";

const StoreSidebar = ({storeInfo, isAdmin}) => {
    const [showSettings, setShowSettings] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const pathname = usePathname()

    // Regular seller links
    const sellerLinks = [
        { name: 'Dashboard', href: '/store', icon: HomeIcon },
        { name: 'Categories', href: '/store/categories', icon: FolderIcon },
        { name: 'Add Product', href: '/store/add-product', icon: SquarePlusIcon },
        { name: 'Manage Product', href: '/store/manage-product', icon: SquarePenIcon },
        { name: 'Coupons', href: '/store/coupons', icon: TicketIcon },
        { name: 'Shipping', href: '/store/shipping', icon: TruckIcon },
        { name: 'Customers', href: '/store/customers', icon: UsersIcon },
        { name: 'Orders', href: '/store/orders', icon: LayoutListIcon },
        { name: 'Return Requests', href: '/store/return-requests', icon: RefreshCw },
        { name: 'Reviews', href: '/store/reviews', icon: StarIcon },
        { name: 'Enquiry Messages', href: '/store/enquiries', icon: StarIcon },
        { name: 'Contact Us Messages', href: '/store#contact-messages', icon: StarIcon },
    ]

    // Admin-only links
    const adminLinks = [
        { name: '👑 ADMIN SECTION', href: '#', icon: null, isHeader: true },
        { name: 'Home', href: '/store/home', icon: HomeIcon },
        { name: 'Blog Articles', href: '/store/blogs', icon: LayoutListIcon },
        { name: 'Menu Management', href: '/store/menu-management', icon: LayoutListIcon },
    ]

    // Combine links based on user role
    const sidebarLinks = isAdmin ? [...sellerLinks, ...adminLinks] : sellerLinks;

    return (
        <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 h-screen overflow-y-auto transition-all duration-300 ease-in-out max-sm:fixed max-sm:top-0 max-sm:left-0 max-sm:z-50 max-sm:shadow-2xl ${isOpen ? 'max-sm:w-64' : 'max-sm:w-0'}`}>
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 max-sm:justify-between">
                <div className="flex items-center gap-3">
                    {/* <Image
                        className="w-14 h-14 rounded-full shadow-md"
                        src={storeInfo?.logo && !storeInfo.logo.includes('placehold.co') ? storeInfo.logo : '/default-store-logo.png'}
                        alt={storeInfo?.name || 'Store Logo'}
                        width={80}
                        height={80}
                    /> */}
                    <p className="text-slate-700">{storeInfo?.name || 'Thessah.ae'}</p>
                </div>
            </div>
            <div className="max-sm:mt-6">
                {
                    sidebarLinks.map((link, index) => 
                        link.isHeader ? (
                            <div key={index} className="px-5 py-3 mt-4 text-xs font-semibold text-amber-600 border-t border-b border-amber-200 bg-amber-50 max-sm:hidden">
                                {link.name}
                            </div>
                        ) : (
                            <Link key={index} href={link.href} className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 transition ${pathname === link.href && 'bg-slate-100 sm:text-slate-600'}`}>
                                {link.icon && <link.icon size={18} className="sm:ml-5" />}
                                <p className="max-sm:hidden">{link.name}</p>
                                {pathname === link.href && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l"></span>}
                            </Link>
                        )
                    )
                }
            </div>
            <div className="mt-auto p-4 border-t border-slate-200 flex flex-col items-center">
                {/* Desktop: full button, Mobile: icon only */}
                <button
                    className="w-44 px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-blue-600 hover:text-white transition max-sm:hidden"
                    onClick={() => setShowSettings(true)}
                >
                    Settings
                </button>
                <button
                    className="sm:hidden p-2 rounded-full bg-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white transition"
                    aria-label="Settings"
                    onClick={() => setShowSettings(true)}
                >
                    {/* Lucide settings icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.94-2.34a1 1 0 0 0 .26-1.09l-1.43-2.49a1 1 0 0 1 0-.94l1.43-2.49a1 1 0 0 0-.26-1.09l-2.12-2.12a1 1 0 0 0-1.09-.26l-2.49 1.43a1 1 0 0 1-.94 0l-2.49-1.43a1 1 0 0 0-1.09.26l-2.12 2.12a1 1 0 0 0-.26 1.09l1.43 2.49a1 1 0 0 1 0 .94l-1.43 2.49a1 1 0 0 0 .26 1.09l2.12 2.12a1 1 0 0 0 1.09.26l2.49-1.43a1 1 0 0 1 .94 0l2.49 1.43a1 1 0 0 0 1.09-.26l2.12-2.12z" />
                    </svg>
                </button>
            </div>
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-95" style={{backdropFilter: 'blur(2px)'}}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-0 relative flex flex-col">
                        <button onClick={() => setShowSettings(false)} className="absolute top-3 right-4 text-2xl text-slate-400 hover:text-slate-700">&times;</button>
                        <SimpleSettingsModal />
                    </div>
                </div>
            )}
        </aside>
    )
}


function SimpleSettingsModal() {
    const { user, getToken } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [image, setImage] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    // Populate fields when user is loaded or changes
    useEffect(() => {
        setName(user?.displayName || user?.name || "");
        setEmail(user?.email || "");
        setImage(user?.photoURL || user?.image || "");
    }, [user]);

    // Live preview for uploaded image, fallback to current or first letter avatar
    let imagePreview = null;
    if (imageFile) {
        imagePreview = URL.createObjectURL(imageFile);
    } else if (image) {
        imagePreview = image;
    }

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        try {
            const token = await getToken();
            let imageUrl = image;
            if (imageFile) {
                // Upload image to server or imagekit (implement as needed)
                const formData = new FormData();
                formData.append("image", imageFile);
                const res = await axios.post("/api/store/profile/upload-image", formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                imageUrl = res.data.url;
            }
            await axios.post("/api/store/profile/update", { name, image: imageUrl, email }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage("Profile updated successfully!");
            setImage(imageUrl);
            setImageFile(null);
        } catch (err) {
            setMessage(err?.response?.data?.error || err.message);
        }
        setSaving(false);
    };

    return (
        <div className="flex flex-col gap-4 p-8">
            {/* Profile form */}
            <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 mb-4">
                <div className="relative w-24 h-24">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Profile" className="w-24 h-24 rounded-full object-cover border shadow bg-slate-100" />
                    ) : (
                        <span className="w-24 h-24 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-4xl border shadow bg-slate-100 select-none">
                            {(name?.[0] || email?.[0] || 'U').toUpperCase()}
                        </span>
                    )}
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-lg" title="Upload image">
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                            if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                        }} />
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 16v-8m0 0l-3 3m3-3l3 3"/></svg>
                    </label>
                </div>
                <div className="text-center mt-2">
                    <div className="font-semibold text-lg">{name || "Your Name"}</div>
                    <div className="text-slate-500 text-sm">{email || "your@email.com"}</div>
                </div>
            </div>
            <label className="flex flex-col gap-1">
                Name
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded" required />
            </label>
            <label className="flex flex-col gap-1">
                Email
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 rounded" required />
            </label>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded mt-2" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
            </button>
            {message && <div className="text-green-600 mt-2 text-center">{message}</div>}
            </form>
        </div>
    );
}

export default StoreSidebar