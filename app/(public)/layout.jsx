'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import GuestOrderLinker from "@/components/GuestOrderLinker";
import TopBarNotification from "@/components/TopBarNotification";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { usePathname } from "next/navigation";

import { fetchCart, uploadCart } from "@/lib/features/cart/cartSlice";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";



function PublicLayoutAuthed({ children }) {
    const dispatch = useDispatch();
    const { cartItems } = useSelector((state) => state.cart);
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const shouldPrefetchProducts = !pathname?.startsWith('/category/');

    useEffect(() => { 
        if (!shouldPrefetchProducts) return;
        // Defer product fetch to allow critical content to load first
        const timer = setTimeout(() => {
            dispatch(fetchProducts({ compact: true, limit: 24 })); 
        }, 100);
        return () => clearTimeout(timer);
    }, [dispatch, shouldPrefetchProducts]);

    return (
        <div className="flex flex-col min-h-screen">
            <GuestOrderLinker />
            {/* <Banner />/ */}
            <main className={`flex-1 ${isHomePage ? 'pb-8' : 'pb-20'} lg:pb-0`}>{children}</main>
            {!isHomePage && <MobileBottomNav />}
        </div>
    );
}

function PublicLayoutGuest({ children }) {
    const dispatch = useDispatch();
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const shouldPrefetchProducts = !pathname?.startsWith('/category/');
    useEffect(() => { 
        if (!shouldPrefetchProducts) return;
        // Defer product fetch
        const timer = setTimeout(() => {
            dispatch(fetchProducts({ compact: true, limit: 24 })); 
        }, 100);
        return () => clearTimeout(timer);
    }, [dispatch, shouldPrefetchProducts]);
    return (
        <div className="flex flex-col min-h-screen">
            {/* <Banner /> */}
            <main className={`flex-1 ${isHomePage ? 'pb-8' : 'pb-20'} lg:pb-0`}>{children}</main>
            {!isHomePage && <MobileBottomNav />}
            <Footer />
        </div>
    );
}

export default function PublicLayout(props) {
    return (
        <PublicLayoutAuthed {...props} />
    );
}
