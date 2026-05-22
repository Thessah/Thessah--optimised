'use client'


import Link from "next/link"
import { useAuth } from "@/lib/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";


const StoreNavbar = ({ storeInfo, onToggleSidebar }) => {
    const { user } = useAuth();

    const handleLogout = async () => {
        if (user) {
            // Firebase logout
            await signOut(auth);
            window.location.href = "/";
        }
    };

    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="sm:hidden inline-flex items-center justify-center p-2 rounded-md border border-slate-300 text-slate-700"
                    aria-label="Open menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <p>Hi, {storeInfo?.name || user?.displayName || user?.name || user?.email || ''}</p>
            </div>
        </div>
    )
}

export default StoreNavbar