'use client'
import { useSelector } from "react-redux";
import { useMemo, useEffect, useState, lazy, Suspense } from "react";
import dynamic from "next/dynamic";

// Cache constants
const SECTIONS_CACHE_KEY = 'home:sections:v1'
const GRID_CACHE_KEY = 'home:grid:v1'
const SECTION4_CACHE_KEY = 'home:section4:v1'
const TTL_MS = 10 * 60 * 1000 // 10 minutes

// Critical above-the-fold components - load immediately
import Hero from "@/components/Hero";
import HomeCategories from "@/components/HomeCategories";
import LatestProducts from "@/components/LatestProducts";
import CollectionsShowcase from "@/components/CollectionsShowcase";
import ShopByCategory from "@/components/ShopByCategory";
import TanishqWorld from "@/components/TanishqWorld";
import ShopByGender from "@/components/ShopByGender";
import TanishqExperience from "@/components/TanishqExperience";
import PromotionBanner from "@/components/PromotionBanner";

// Below-the-fold components - lazy load
const BannerSlider = dynamic(() => import("@/components/BannerSlider"), { ssr: true });
const Section3 = dynamic(() => import("@/components/section3"), { ssr: false });
const Section4 = dynamic(() => import("@/components/section4"), { ssr: false });
const OriginalBrands = dynamic(() => import("@/components/OriginalBrands"), { ssr: false });
const QuickFyndCategoryDirectory = dynamic(() => import("@/components/QuickFyndCategoryDirectory"), { ssr: false });
const KeywordPills = dynamic(() => import("@/components/KeywordPills"), { ssr: false });

export default function Home() {
    const products = useSelector(state => state.product.list);
    const [adminSections, setAdminSections] = useState([]);
    const [gridSections, setGridSections] = useState([]);
    const [section4Data, setSection4Data] = useState([]);

    useEffect(() => {
        // 1) Seed from cache immediately if fresh
        try {
            const rawSections = sessionStorage.getItem(SECTIONS_CACHE_KEY)
            if (rawSections) {
                const cached = JSON.parse(rawSections)
                if (cached?.data && Array.isArray(cached.data) && (Date.now() - cached.ts < TTL_MS)) {
                    setAdminSections(cached.data)
                }
            }
            const rawGrid = sessionStorage.getItem(GRID_CACHE_KEY)
            if (rawGrid) {
                const cached = JSON.parse(rawGrid)
                if (cached?.data && Array.isArray(cached.data) && (Date.now() - cached.ts < TTL_MS)) {
                    setGridSections(cached.data)
                }
            }
            const rawSection4 = sessionStorage.getItem(SECTION4_CACHE_KEY)
            if (rawSection4) {
                const cached = JSON.parse(rawSection4)
                if (cached?.data && Array.isArray(cached.data) && (Date.now() - cached.ts < TTL_MS)) {
                    setSection4Data(cached.data)
                }
            }
        } catch {}

        // 2) Revalidate in parallel with timeout
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 6000)

        const fetchData = async () => {
            try {
                const [sectionsRes, gridRes, section4Res] = await Promise.all([
                    fetch('/api/store/home-sections', { cache: 'no-store', signal: controller.signal }),
                    fetch('/api/store/grid-products', { cache: 'no-store', signal: controller.signal }),
                    fetch('/api/store/section4', { cache: 'no-store', signal: controller.signal })
                ])

                if (sectionsRes.ok) {
                    const data = await sectionsRes.json()
                    const sections = data?.sections || []
                    setAdminSections(sections)
                    try { sessionStorage.setItem(SECTIONS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: sections })) } catch {}
                }
                if (gridRes.ok) {
                    const data = await gridRes.json()
                    const sections = Array.isArray(data?.sections) ? data.sections : []
                    setGridSections(sections)
                    try { sessionStorage.setItem(GRID_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: sections })) } catch {}
                }
                if (section4Res.ok) {
                    const data = await section4Res.json()
                    const sections = data?.sections || []
                    setSection4Data(sections)
                    try { sessionStorage.setItem(SECTION4_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: sections })) } catch {}
                }

                clearTimeout(timer)
            } catch (error) {
                if (error?.name !== 'AbortError') console.error('Error fetching data:', error)
                clearTimeout(timer)
            }
        }
        fetchData()

        return () => {
            controller.abort()
            clearTimeout(timer)
        }
    }, [])

    const curatedSections = useMemo(() => {
        return adminSections.map(section => {
            let sectionProducts = section.productIds?.length > 0
                ? products.filter(p => section.productIds.includes(p.id))
                : products;

            // Filter by category if specified
            if (section.category) {
                sectionProducts = sectionProducts.filter(p => p.category === section.category);
            }

            return {
                title: section.section,
                products: sectionProducts,
                viewAllLink: section.category ? `/shop?category=${section.category}` : '/shop'
            };
        });
    }, [adminSections, products]);

    // Fallback: Create sections based on categories if no admin sections
    const categorySections = useMemo(() => {
        if (adminSections.length > 0) return [];
        
        const categories = [...new Set(products.map(p => (p.category || '').toLowerCase()))];

        return categories.slice(0, 4).map(category => ({
            title: `Top Deals on ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            products: products.filter(p => (p.category || '').toLowerCase() === category),
            viewAllLink: `/shop?category=${category}`
        }));
    }, [products, adminSections]);

    const sections = curatedSections.length > 0 ? curatedSections : categorySections;

    // Prepare grid sections with product details
    const gridSectionsWithProducts = gridSections.map(section => ({
        ...section,
        products: (section.productIds || []).map(pid => products.find(p => p.id === pid)).filter(Boolean)
    }));
    // Only show grid if at least one section has a title and products
    const showGrid = gridSectionsWithProducts.some(s => s.title && s.products && s.products.length > 0);

    return (
        <>
            {/* <HomeCategories/> */}
            <Hero />
            <CollectionsShowcase />
            <ShopByCategory />
            <TanishqWorld />
            <ShopByGender />
            <PromotionBanner />
            {/* <LatestProducts /> */}
            {/* <BannerSlider/> */}
            {/* <Section3/> */}
            
            {/* Category Sections */}
            {/* {section4Data.length > 0 && (
                <Section4 sections={section4Data} />
            )} */}
            
            <TanishqExperience />
            {/* <OriginalBrands/> */}
       
        </>
    );
}
