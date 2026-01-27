import { Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import React from "react";
import MetaPixel from "@/components/MetaPixel";
import SocialProofPopup from "@/components/SocialProofPopup";
import ClientLayout from "./ClientLayout";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  title: "Thessah Jewellery – Where Elegance Meets Craftsmanship",
  description:
    "Thessah Jewellery offers beautifully crafted designs made to shine forever. Find luxury jewellery pieces perfect for weddings, gifts, and everyday elegance.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};
// Performance optimization
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }) {
  const ik = process.env.IMAGEKIT_URL_ENDPOINT;
  let ikOrigin = null;
  try {
    if (ik) ikOrigin = new URL(ik).origin;
  } catch {}

  return (
    <html lang="en">
      <head>
        {/* ImageKit Optimization */}
        {ikOrigin && (
          <>
            <link rel="dns-prefetch" href={ikOrigin} />
            <link rel="preconnect" href={ikOrigin} crossOrigin="anonymous" />
          </>
        )}
      </head>
      <body className={`${outfit.className} antialiased`} suppressHydrationWarning>
        {/* Google Tag Manager (noscript must be immediately after <body>) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5QLZ2255"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Google Tag Manager - load after interactive */}
        <Script id="gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-5QLZ2255');
          `}
        </Script>
        <MetaPixel />
        {/* Add Navbar and Footer globally via ClientLayout */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
