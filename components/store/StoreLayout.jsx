'use client'
import { useEffect, useState } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import SellerNavbar from "./StoreNavbar"
import SellerSidebar from "./StoreSidebar"


import axios from "axios"
import { useAuth } from "@/lib/useAuth";

const StoreLayout = ({ children }) => {

    const { user, loading, getToken } = useAuth();

    const [isSeller, setIsSeller] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [sellerLoading, setSellerLoading] = useState(true);
    const [storeInfo, setStoreInfo] = useState(null);

    const fetchIsSeller = async () => {
        if (!user) return;
        try {
            const token = await getToken(true); // Force refresh token
            if (!token) {
                console.log('[StoreLayout] No token available');
                setSellerLoading(false);
                return;
            }
            
            console.log('[StoreLayout] User authenticated:', user.email);
            
            // Only allow configured admin email
            const allowedEmail = (process.env.NEXT_PUBLIC_STORE_ADMIN_EMAIL || 'thessahjewellery@gmail.com').toLowerCase();
            if (user.email?.toLowerCase() !== allowedEmail) {
                console.log('[StoreLayout] ❌ Access denied for:', user.email);
                setIsSeller(false);
                setIsAdmin(false);
                setSellerLoading(false);
                return;
            }
            
            console.log('[StoreLayout] ✅ Access granted for:', user.email);
            setIsSeller(true);
            setIsAdmin(true);
            setStoreInfo({ name: 'Thessah Store', status: 'approved' });
        } catch (error) {
            console.log('[StoreLayout] Auth error:', error?.message);
            setIsSeller(false);
        } finally {
            setSellerLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && user) {
            fetchIsSeller();
        } else if (!loading && !user) {
            // Prevent infinite spinner on /store routes for signed-out users.
            setSellerLoading(false);
        }
    }, [loading, user]);

    return (loading || sellerLoading) ? (
        <Loading />
    ) : !user ? (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">Authentication Required</h1>
            <p className="text-slate-500 mt-4 mb-8">Please sign in with the authorized email to access the store dashboard.</p>
            <Link href="/login" className="bg-slate-700 text-white flex items-center gap-2 mt-4 p-2 px-6 max-sm:text-sm rounded-full">
                Go to login <ArrowRightIcon size={18} />
            </Link>
        </div>
    ) : (isSeller || isAdmin) ? (
        <div className="flex flex-col h-screen">
            <SellerNavbar storeInfo={storeInfo} isAdmin={isAdmin} />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <SellerSidebar storeInfo={storeInfo} isAdmin={isAdmin} />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">Access Restricted</h1>
            <p className="text-slate-500 mt-4 mb-2">
                This store dashboard is only accessible to:
            </p>
            <p className="text-lg font-semibold text-red-600 mb-4">
                {(process.env.NEXT_PUBLIC_STORE_ADMIN_EMAIL || 'thessahjewellery@gmail.com')}
            </p>
            {user?.email && (
                <p className="text-sm text-slate-500 mb-6">
                    You are signed in as: <span className="font-medium">{user.email}</span>
                </p>
            )}
            <Link href="/" className="bg-slate-700 text-white flex items-center gap-2 mt-4 p-2 px-6 max-sm:text-sm rounded-full">
                Go to Home <ArrowRightIcon size={18} />
            </Link>
        </div>
    )
}

export default StoreLayout