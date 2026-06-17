


import { NextResponse } from 'next/server';


// Only protect API routes
const apiProtectedRoutes = [
  /^\/api\/store(\/.*)?$/,
  /^\/api\/wishlist(\/.*)?$/,
];

// Public endpoints that don't require authentication
const publicEndpoints = [
  '/api/store/categories', // Allow GET requests to view categories
  '/api/store/shop-categories', // Allow GET shop categories with images
  '/api/store/hero-banners', // Allow GET hero banners (used by Hero component)
  '/api/store/home-sections', // Allow GET home sections (used on public pages)
  '/api/store/grid-products', // Allow GET grid products
  '/api/store/section4', // Allow GET section4 collections
  '/api/store/upload-banner', // Allow image uploads
  '/api/store/collections', // Allow GET collections (used by CollectionsShowcase)
  '/api/store/collections/upload', // Allow image uploads for collections
  '/api/store/settings', // Allow GET/PUT homepage settings
  '/api/gold-rate', // Public gold rate endpoint for live rates
];

if (process.env.NODE_ENV !== 'production') {
  publicEndpoints.push('/api/store/ads-post/dev-test');
}


export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Allow public endpoints without auth (for all methods)
  if (publicEndpoints.includes(pathname)) {
    return NextResponse.next();
  }
  
  const isApiProtected = apiProtectedRoutes.some((regex) => regex.test(pathname));
  if (!isApiProtected) return NextResponse.next();

  // Only check for presence of Authorization header for API routes
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/store/:path*',
    '/api/wishlist/:path*',
  ],
};