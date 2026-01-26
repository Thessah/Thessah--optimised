
"use server";
import imagekit from "@/configs/imageKit";
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";
import { getAuth } from '@/lib/firebase-admin';

// Helper: Upload images to ImageKit
const uploadImages = async (images) => {
    return Promise.all(
        images.map(async (image) => {
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imagekit.upload({
                file: buffer,
                fileName: image.name,
                folder: "products"
            });
            return imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: "auto" },
                    { format: "webp" },
                    { width: "1024" }
                ]
            });
        })
    );
};

// POST: Create a new product
export async function POST(request) {
    try {
        await connectDB();

        // Firebase Auth: Extract token from Authorization header
        const authHeader = request.headers.get('authorization');
        console.log('[CREATE PRODUCT] Auth header present:', !!authHeader);
        
        let userId = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const idToken = authHeader.split('Bearer ')[1];
            console.log('[CREATE PRODUCT] Token extracted:', idToken.substring(0, 20) + '...');
            
            const { getAuth } = await import('firebase-admin/auth');
            const { initializeApp, applicationDefault, getApps } = await import('firebase-admin/app');
            if (getApps().length === 0) {
                initializeApp({ credential: applicationDefault() });
            }
            try {
                const decodedToken = await getAuth().verifyIdToken(idToken);
                userId = decodedToken.uid;
                console.log('[CREATE PRODUCT] User ID from token:', userId);
            } catch (e) {
                console.error('[CREATE PRODUCT] Token verification failed:', e.message);
                return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
            }
        } else {
            console.log('[CREATE PRODUCT] No valid authorization header');
            return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
        }
        
        const storeId = await authSeller(userId);
        console.log('[CREATE PRODUCT] Store ID from authSeller:', storeId);
        
        if (!storeId) {
            const { default: Store } = await import('@/models/Store');
            const userStore = await Store.findOne({ userId }).lean();
            
            if (!userStore) {
                return NextResponse.json({ error: "You don't have a store yet. Please create a store first." }, { status: 403 });
            }
            if (userStore.status === 'pending') {
                return NextResponse.json({ error: "Your store is pending approval. Please wait for admin approval." }, { status: 403 });
            }
            if (userStore.status === 'rejected') {
                return NextResponse.json({ error: "Your store was rejected. Contact support." }, { status: 403 });
            }
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");
        const category = formData.get("category");
        const sku = formData.get("sku") || null;
        const images = formData.getAll("images");
        // Tags: accept JSON string or comma-separated
        let tagsRaw = formData.get("tags");
        let tags = [];
        if (typeof tagsRaw === 'string' && tagsRaw.trim().length > 0) {
            try {
                const parsed = JSON.parse(tagsRaw);
                if (Array.isArray(parsed)) tags = parsed.map(t => String(t).trim()).filter(Boolean);
                else tags = String(tagsRaw).split(',').map(t => t.trim()).filter(Boolean);
            } catch {
                tags = String(tagsRaw).split(',').map(t => t.trim()).filter(Boolean);
            }
        }
        const stockQuantity = formData.get("stockQuantity") ? Number(formData.get("stockQuantity")) : 0;
        // New: variants support
        const hasVariants = String(formData.get("hasVariants") || "false").toLowerCase() === "true";
        const variantsRaw = formData.get("variants"); // expected JSON string if hasVariants
        const attributesRaw = formData.get("attributes"); // optional JSON of attribute definitions
        // Fast delivery toggle
        const fastDelivery = String(formData.get("fastDelivery") || "false").toLowerCase() === "true";

        // Base pricing (used when no variants)
        const AED = Number(formData.get("AED"));
        const price = Number(formData.get("price"));
        // Slug from form (manual or auto)
        let slug = formData.get("slug")?.toString().trim() || "";
        if (slug) {
            // Clean up slug: only allow a-z, 0-9, dash
            slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
            slug = slug.replace(/(^-|-$)+/g, '');
        } else {
            // Generate slug from name
            slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
        }
        // Ensure slug is unique
        const existing = await Product.findOne({ slug }).lean();
        if (existing) {
            return NextResponse.json({ error: "Slug already exists. Please use a different slug." }, { status: 400 });
        }

        // Validate core fields
        if (!name || !description || !category || images.length < 1) {
            return NextResponse.json({ error: "Missing product details" }, { status: 400 });
        }

        let variants = [];
        let finalPrice = price;
        let finalAED = AED;
        let inStock = true;

        if (hasVariants) {
            try {
                variants = JSON.parse(variantsRaw || "[]");
                if (!Array.isArray(variants) || variants.length === 0) {
                    return NextResponse.json({ error: "Variants must be a non-empty array when hasVariants is true" }, { status: 400 });
                }
            } catch (e) {
                return NextResponse.json({ error: "Invalid variants JSON" }, { status: 400 });
            }

            // Compute derived fields from variants
            const prices = variants.map(v => Number(v.price)).filter(n => Number.isFinite(n));
            const AEDs = variants.map(v => Number(v.AED ?? v.price)).filter(n => Number.isFinite(n));
            const stocks = variants.map(v => Number(v.stock ?? 0)).filter(n => Number.isFinite(n));
            finalPrice = prices.length ? Math.min(...prices) : 0;
            finalAED = AEDs.length ? Math.min(...AEDs) : finalPrice;
            inStock = stocks.some(s => s > 0);
        } else {
            // No variants: require price and AED
            if (!Number.isFinite(price) || !Number.isFinite(AED)) {
                return NextResponse.json({ error: "Price and AED are required when no variants provided" }, { status: 400 });
            }
            inStock = true;
        }

        // Support both file uploads and string URLs
        let imagesUrl = [];
        const filesToUpload = images.filter(img => typeof img !== 'string');
        const urls = images.filter(img => typeof img === 'string');
        if (filesToUpload.length > 0) {
            const uploaded = await uploadImages(filesToUpload);
            imagesUrl = [...urls, ...uploaded];
        } else {
            imagesUrl = urls;
        }

        // Parse attributes optionally
        let attributes = {};
        let shortDescription = null;
        if (attributesRaw) {
            try {
                attributes = JSON.parse(attributesRaw) || {};
                // Extract shortDescription from attributes
                if (attributes.shortDescription) {
                    shortDescription = attributes.shortDescription;
                }
            } catch {
                attributes = {};
            }
        }

        // Price Breakup fields
        const goldType = formData.get("goldType") || null;
        const goldWeight = formData.get("goldWeight") ? Number(formData.get("goldWeight")) : 0;
        const goldRate = formData.get("goldRate") ? Number(formData.get("goldRate")) : 0;
        const stoneWeight = formData.get("stoneWeight") ? Number(formData.get("stoneWeight")) : 0;
        const stonePrice = formData.get("stonePrice") ? Number(formData.get("stonePrice")) : 0;
        const makingCharges = formData.get("makingCharges") ? Number(formData.get("makingCharges")) : 0;
        const metalDetailsRaw = formData.get("metalDetails");
        const generalDetailsRaw = formData.get("generalDetails");
        let metalDetails = [];
        let generalDetails = [];
        try {
            if (metalDetailsRaw) metalDetails = JSON.parse(metalDetailsRaw) || [];
            if (generalDetailsRaw) generalDetails = JSON.parse(generalDetailsRaw) || [];
        } catch {}

        // Button visibility
        const showBuyButton = String(formData.get("showBuyButton") || "true").toLowerCase() === "true";
        const showEnquiryButton = String(formData.get("showEnquiryButton") || "true").toLowerCase() === "true";

        const product = await Product.create({
            name,
            slug,
            description,
            shortDescription,
            AED: finalAED,
            price: finalPrice,
            category,
            sku,
            images: imagesUrl,
            hasVariants,
            variants,
            attributes,
            inStock,
            fastDelivery,
            stockQuantity,
            tags,
            storeId,
            goldType,
            goldWeight,
            goldRate,
            stoneWeight,
            stonePrice,
            makingCharges,
            metalDetails,
            generalDetails,
            showBuyButton,
            showEnquiryButton,
        });

        return NextResponse.json({ message: "Product added successfully", product });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// GET: Get all products of the seller
export async function GET(request) {
    try {
        await connectDB();

        // ADMIN/GLOBAL: Return all products, no auth required
        const products = await Product.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ products });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// PUT: Update a product
export async function PUT(request) {
    try {
        await connectDB();

        // Firebase Auth: Extract token from Authorization header
        const authHeader = request.headers.get('authorization');
        let userId = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const idToken = authHeader.split('Bearer ')[1];
            const { getAuth } = await import('firebase-admin/auth');
            const { initializeApp, applicationDefault, getApps } = await import('firebase-admin/app');
            if (getApps().length === 0) {
                initializeApp({ credential: applicationDefault() });
            }
            try {
                const decodedToken = await getAuth().verifyIdToken(idToken);
                userId = decodedToken.uid;
            } catch (e) {
                // Not signed in, userId remains null
            }
        }
        const storeId = await authSeller(userId);
        if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

        const formData = await request.formData();
        const productId = formData.get("productId");
        const name = formData.get("name");
        const description = formData.get("description");
        const category = formData.get("category");
        const sku = formData.get("sku");
        const images = formData.getAll("images");
        const stockQuantity = formData.get("stockQuantity") ? Number(formData.get("stockQuantity")) : undefined;
        // Variants support
        const hasVariants = String(formData.get("hasVariants") || "").toLowerCase() === "true";
        const variantsRaw = formData.get("variants");
        const attributesRaw = formData.get("attributes");
        // Tags: accept JSON or comma-separated
        let tagsRaw = formData.get("tags");
        let tags = undefined; // undefined means don't change
        if (typeof tagsRaw === 'string') {
            const trimmed = tagsRaw.trim();
            if (trimmed.length > 0) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) tags = parsed.map(t => String(t).trim()).filter(Boolean);
                    else tags = String(trimmed).split(',').map(t => t.trim()).filter(Boolean);
                } catch {
                    tags = String(trimmed).split(',').map(t => t.trim()).filter(Boolean);
                }
            } else {
                tags = []; // explicit empty to clear tags
            }
        }
        const AED = formData.get("AED") ? Number(formData.get("AED")) : undefined;
        const price = formData.get("price") ? Number(formData.get("price")) : undefined;
        const fastDelivery = String(formData.get("fastDelivery") || "").toLowerCase() === "true";
        let slug = formData.get("slug")?.toString().trim() || "";
        if (slug) {
            slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
            slug = slug.replace(/(^-|-$)+/g, '');
        }


        if (!productId || typeof productId !== 'string' || !productId.match(/^[a-fA-F0-9]{24}$/)) {
            console.error('Invalid or missing productId:', productId);
            return NextResponse.json({ error: "Product ID required or invalid format" }, { status: 400 });
        }

        let product;
        try {
            product = await Product.findById(productId).lean();
        } catch (err) {
            console.error('Product.findById error:', err, 'productId:', productId);
            return NextResponse.json({ error: "Invalid productId format" }, { status: 400 });
        }
        if (!product || product.storeId !== storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

        let imagesUrl = product.images;
        // If images are all strings (URLs), treat as full replacement (for deletion)
        if (images.length > 0) {
            if (images.every(img => typeof img === 'string')) {
                imagesUrl = images;
            } else {
                const uploaded = await uploadImages(images.filter(img => typeof img !== 'string'));
                // Keep existing URLs, append new uploads
                imagesUrl = [...product.images, ...uploaded];
            }
        }

        // Compute variants/price/AED/inStock
        let variants = product.variants || [];
        let attributes = product.attributes || {};
        let finalPrice = price ?? product.price;
        let finalAED = AED ?? product.AED;
        let inStock = product.inStock;

        if (hasVariants) {
            try { variants = JSON.parse(variantsRaw || "[]"); } catch { variants = []; }
            const prices = variants.map(v => Number(v.price)).filter(n => Number.isFinite(n));
            const AEDs = variants.map(v => Number(v.AED ?? v.price)).filter(n => Number.isFinite(n));
            const stocks = variants.map(v => Number(v.stock ?? 0)).filter(n => Number.isFinite(n));
            finalPrice = prices.length ? Math.min(...prices) : finalPrice;
            finalAED = AEDs.length ? Math.min(...AEDs) : finalAED;
            inStock = stocks.some(s => s > 0);
        } else if (price !== undefined || AED !== undefined) {
            // no variants, keep numeric price/AED if provided
            if (price !== undefined) finalPrice = price;
            if (AED !== undefined) finalAED = AED;
        }

        let shortDescription = product.shortDescription;
        if (attributesRaw) {
            try {
                attributes = JSON.parse(attributesRaw) || attributes;
                // Extract shortDescription from attributes
                if (attributes.shortDescription !== undefined) {
                    shortDescription = attributes.shortDescription;
                }
            } catch {}
        }

        // Price Breakup fields for update
        const goldType = formData.get("goldType") || product.goldType;
        const goldWeight = formData.get("goldWeight") ? Number(formData.get("goldWeight")) : product.goldWeight;
        const goldRate = formData.get("goldRate") ? Number(formData.get("goldRate")) : product.goldRate;
        const stoneWeight = formData.get("stoneWeight") ? Number(formData.get("stoneWeight")) : product.stoneWeight;
        const stonePrice = formData.get("stonePrice") ? Number(formData.get("stonePrice")) : product.stonePrice;
        const makingCharges = formData.get("makingCharges") ? Number(formData.get("makingCharges")) : product.makingCharges;
        const metalDetailsRaw = formData.get("metalDetails");
        const generalDetailsRaw = formData.get("generalDetails");
        let metalDetails = product.metalDetails || [];
        let generalDetails = product.generalDetails || [];
        try {
            if (metalDetailsRaw) metalDetails = JSON.parse(metalDetailsRaw) || [];
            if (generalDetailsRaw) generalDetails = JSON.parse(generalDetailsRaw) || [];
        } catch {}

        // Button visibility for update
        const showBuyButton = formData.get("showBuyButton") !== null ? String(formData.get("showBuyButton")).toLowerCase() === "true" : product.showBuyButton;
        const showEnquiryButton = formData.get("showEnquiryButton") !== null ? String(formData.get("showEnquiryButton")).toLowerCase() === "true" : product.showEnquiryButton;

        // If slug is provided and changed, check uniqueness
        let updateData = {
            name,
            description,
            shortDescription,
            AED: finalAED,
            price: finalPrice,
            category,
            sku,
            images: imagesUrl,
            hasVariants,
            variants,
            attributes,
            inStock,
            fastDelivery,
            goldType,
            goldWeight,
            goldRate,
            stoneWeight,
            stonePrice,
            makingCharges,
            metalDetails,
            generalDetails,
            showBuyButton,
            showEnquiryButton,
        };

        if (tags !== undefined) {
            updateData.tags = tags;
        }

        // Add stockQuantity if provided
        if (stockQuantity !== undefined) {
            updateData.stockQuantity = stockQuantity;
        }
        if (slug && slug !== product.slug) {
            const existing = await Product.findOne({ slug }).lean();
            if (existing && existing._id.toString() !== productId) {
                return NextResponse.json({ error: "Slug already exists. Please use a different slug." }, { status: 400 });
            }
            updateData.slug = slug;
        }
        product = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        ).lean();

        return NextResponse.json({ message: "Product updated successfully", product });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// DELETE: Delete a product
export async function DELETE(request) {
    try {
        await connectDB();

        // Firebase Auth: Extract token from Authorization header
        const authHeader = request.headers.get('authorization');
        let userId = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const idToken = authHeader.split('Bearer ')[1];
            const { getAuth } = await import('firebase-admin/auth');
            const { initializeApp, applicationDefault, getApps } = await import('firebase-admin/app');
            if (getApps().length === 0) {
                initializeApp({ credential: applicationDefault() });
            }
            try {
                const decodedToken = await getAuth().verifyIdToken(idToken);
                userId = decodedToken.uid;
            } catch (e) {
                // Not signed in, userId remains null
            }
        }
        const storeId = await authSeller(userId);
        if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

        const product = await Product.findById(productId).lean();
        if (!product || product.storeId !== storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

        await Product.findByIdAndDelete(productId);
        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

