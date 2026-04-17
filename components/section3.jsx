"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import Dummy from '../assets/ads.png';

export default function TopDeals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heading, setHeading] = useState({
    title: 'Top Deals',
    subtitle: ''
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: productData }, { data: settingsRes }] = await Promise.all([
          axios.get("/api/products"),
          axios.get("/api/store/settings")
        ]);

        const allProducts = productData.products || productData;

        const settings = settingsRes?.settings || settingsRes?.data?.settings || {}
        const display = settings?.section3Display || {}
        const selectedProductIds = Array.isArray(display?.selectedProductIds)
          ? display.selectedProductIds
          : []

        let result = allProducts

        if (selectedProductIds.length > 0) {
          const productMap = new Map(
            allProducts.map((p) => [String(p._id || p.id), p])
          )

          result = selectedProductIds
            .map((id) => productMap.get(String(id)))
            .filter(Boolean)
        }

        setProducts(result)

        if (settings?.section3Heading) {
          setHeading(settings.section3Heading)
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="w-full flex justify-center px-4 mt-5">
      <div className="w-full max-w-[1300px] flex gap-6">

        {/* LEFT GRID PRODUCTS */}
        <div className="flex-1">
          <div className="mb-3 sm:mb-5">
            <h2 className="text-lg sm:text-[28px] font-semibold">{heading.title}</h2>
            {heading.subtitle && <p className="text-sm text-gray-600 mt-1">{heading.subtitle}</p>}
          </div>

          {loading ? (
            <p className="text-gray-500 py-5 text-lg text-center">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-gray-500 py-5 text-center">No Deals Found</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-6">

{products?.slice(0, 10).map((item, i) => {
                const img =
                  item.images?.[0] && item.images[0] !== ""
                    ? item.images[0]
                    : "https://ik.imagekit.io/jrstupuke/placeholder.png";

                return (
                  <a
                    key={i}
                    href={`/product/${item.slug}`}
                    className="cursor-pointer text-center block"
                  >
                    <img
                      src={img}
                      alt={item.name}
                      className="w-[80px] h-[70px] sm:w-[150px] sm:h-[140px] mx-auto object-contain hover:scale-105 transition-all duration-200"
                      onError={e => { e.currentTarget.src = "https://ik.imagekit.io/jrstupuke/placeholder.png"; }}
                    />
                    <p className="text-[10px] sm:text-[15px] font-medium mt-1 sm:mt-2 truncate">
                      {item.name}
                    </p>
                    <p className="font-bold text-[9px] sm:text-[16px] mt-0.5 sm:mt-1">
                      From AED{item.price}
                    </p>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT FIXED BANNER */}
        <div className="w-[300px] hidden md:block">
          <Image
            src={Dummy}   // <--- Replace with banner
            alt="Offer Banner"
            className="w-full rounded-lg shadow"
          />
        </div>
      </div>
    </div>
  );
}
