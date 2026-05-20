"use client"
import { usePathname } from "next/navigation"
import { HomeIcon, LayoutListIcon, SquarePenIcon, SquarePlusIcon, StarIcon, FolderIcon, TicketIcon, TruckIcon, RefreshCw, SparklesIcon, User as UserIcon, Users as UsersIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import axios from "axios";

import { useRouter } from "next/navigation"

const StoreSidebar = ({storeInfo, isAdmin}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [enquiryCount, setEnquiryCount] = useState(0);
    const [contactCount, setContactCount] = useState(0);
    const pathname = usePathname()
    const router = useRouter()
    const { getToken } = useAuth();

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const token = await getToken()
                if (!token) return
                const [enquiryRes, contactRes] = await Promise.allSettled([
                    axios.get('/api/store/enquiries', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('/api/store/contact-messages', { headers: { Authorization: `Bearer ${token}` } }),
                ])
                if (enquiryRes.status === 'fulfilled') setEnquiryCount((enquiryRes.value.data.enquiries || []).length)
                if (contactRes.status === 'fulfilled') setContactCount((contactRes.value.data.messages || contactRes.value.data.contactMessages || []).length)
            } catch {}
        }
        fetchCounts()
    }, [pathname])

    // Regular seller links
    const sellerLinks = [
        { name: 'Dashboard', href: '/store', icon: HomeIcon },
        { name: 'Categories', href: '/store/categories', icon: FolderIcon },
        { name: 'Add Product', href: '/store/add-product', icon: SquarePlusIcon },
        // ...existing code...
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
                                <p className="max-sm:hidden flex-1">{link.name}</p>
                                {link.href === '/store/enquiries' && enquiryCount > 0 && (
                                    <span className="max-sm:hidden ml-auto mr-3 min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center">
                                        {enquiryCount}
                                    </span>
                                )}
                                {link.href === '/store#contact-messages' && contactCount > 0 && (
                                    <span className="max-sm:hidden ml-auto mr-3 min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center">
                                        {contactCount}
                                    </span>
                                )}
                                {pathname === link.href && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l"></span>}
                            </Link>
                        )
                    )
                }
            </div>
            <div className="mt-auto p-4 border-t border-slate-200 flex flex-col items-center">
                {/* Desktop: full button, Mobile: icon only */}
                <button
                    onClick={() => router.push('/store/settings')}
                    className="w-44 px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-blue-600 hover:text-white transition max-sm:hidden"
                >
                    Settings
                </button>
                <button
                    onClick={() => router.push('/store/settings')}
                    className="sm:hidden p-2 rounded-full bg-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white transition"
                    aria-label="Settings"
                >
                    {/* Lucide settings icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.94-2.34a1 1 0 0 0 .26-1.09l-1.43-2.49a1 1 0 0 1 0-.94l1.43-2.49a1 1 0 0 0-.26-1.09l-2.12-2.12a1 1 0 0 0-1.09-.26l-2.49 1.43a1 1 0 0 1-.94 0l-2.49-1.43a1 1 0 0 0-1.09.26l-2.12 2.12a1 1 0 0 0-.26 1.09l1.43 2.49a1 1 0 0 1 0 .94l-1.43 2.49a1 1 0 0 0 .26 1.09l2.12 2.12a1 1 0 0 0 1.09.26l2.49-1.43a1 1 0 0 1 .94 0l2.49 1.43a1 1 0 0 0 1.09-.26l2.12-2.12z" />
                    </svg>
                </button>
            </div>
        </aside>
    )
}

export default StoreSidebar