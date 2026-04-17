import { NextResponse } from "next/server";
import authSeller from "@/middlewares/authSeller";
import connectDB from '@/lib/mongoose';
import Category from '@/models/Category';
import Store from '@/models/Store';
import { auth as adminAuth } from '@/lib/firebase-admin';

const normalizeCategorySlug = (value) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// GET - Fetch all categories with their children
export async function GET(req) {
    try {
        // Connect to database first
        await connectDB();
        const { searchParams } = new URL(req.url);
        const lite = searchParams.get('lite') === 'true';
        
        // Fetch categories with longer timeout (15 seconds)
        let categories = [];
        try {
            categories = await Promise.race([
                Category.find({})
                    .select(lite ? 'name slug parentId' : 'name slug description image parentId')
                    .sort({ name: 1 })
                    .lean(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Categories fetch timeout after 15 seconds')), 15000)
                )
            ]);
            console.log('✓ Categories fetched:', categories.length);
            
            // Build parent-child relationships
            const categoryMap = new Map();
            categories.forEach(cat => {
                cat.children = [];
                categoryMap.set(cat._id.toString(), cat);
            });
            
            categories.forEach(cat => {
                if (cat.parentId) {
                    const parent = categoryMap.get(cat.parentId.toString());
                    if (parent) {
                        parent.children.push(cat);
                    }
                }
            });
            
        } catch (fetchError) {
            console.warn('⚠ Categories fetch failed:', fetchError.message);
            categories = [];
        }

        return NextResponse.json({ categories }, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        });
    } catch (error) {
        console.error("❌ Error in categories GET:", error.message);
        return NextResponse.json({ 
            error: "Failed to fetch categories",
            categories: []
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });
    }
}

// POST - Create a new category
export async function POST(req) {

    try {
        await connectDB();
        
        // Firebase Auth
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.warn('❌ No authorization header');
            return NextResponse.json({ error: "Unauthorized: No auth token" }, { status: 401 });
        }
        const idToken = authHeader.split(" ")[1];
        let userId, email;

        try {
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            userId = decodedToken.uid;
            email = decodedToken.email;
        } catch (e) {
            console.warn('⚠ Firebase verification failed:', e.message);
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }
        
        // Check authorization
        if (!userId) {
            console.error('❌ Could not extract userId from token');
            return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
        }
        
        // Check if user has a store
        let isAuthorized = false;
        let store = null;
        try {
            // Check if user has a store (any status)
            store = await Store.findOne({ userId }).lean();
            if (store) {
                isAuthorized = true;
                console.log('✓ Store owner authorized:', userId, '- Status:', store.status);
            } else {
                console.warn('⚠ No store found for user:', userId, '- Auto-creating default store');
                // Auto-create a default store for single owner
                try {
                    store = await Store.create({
                        userId,
                        name: email?.split('@')[0] || 'Default Store',
                        username: email?.split('@')[0]?.toLowerCase() || userId.substring(0, 8),
                        description: 'My Store',
                        email: email || '',
                        status: 'approved',
                        isActive: true,
                    });
                    isAuthorized = true;
                    console.log('✓ Auto-created default store for user:', userId);
                } catch (createError) {
                    console.warn('⚠ Could not auto-create store:', createError.message);
                }
            }
        } catch (authError) {
            console.warn('⚠ Authorization check failed:', authError.message);
            // If database is down/timing out, but we have a valid userId from token, allow it
            if (authError.message?.includes('buffering timed out')) {
                console.log('→ Database timeout during auth check - allowing authenticated user:', userId);
                isAuthorized = true;
            } else {
                throw authError;
            }
        }
        
        if (!isAuthorized) {
            console.error('❌ User not authorized - no admin or store:', userId);
            return NextResponse.json({ error: "Unauthorized: You must have a store to create categories" }, { status: 401 });
        }

        const { name, description, image, parentId } = await req.json();
        const trimmedName = name?.trim();

        if (!trimmedName) {
            return NextResponse.json({ error: "Category name is required" }, { status: 400 });
        }

        // Generate slug from name
        const slug = normalizeCategorySlug(trimmedName);

        const existingCategory = await Category.findOne({ slug }).lean();
        if (existingCategory) {
            return NextResponse.json({
                success: false,
                error: `Category \"${trimmedName}\" already exists`
            }, { status: 409 });
        }

        // Create category - wait up to 30 seconds for MongoDB to respond
        let category = null;
        try {
            console.log('→ Attempting to create category:', trimmedName);
            category = await Promise.race([
                Category.create({
                    name: trimmedName,
                    slug,
                    description: description || null,
                    image: image || null,
                    parentId: parentId || null
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Database timeout - MongoDB taking too long')), 30000)
                )
            ]);
            console.log('✓ Category created successfully:', category._id, '-', trimmedName);
            
            return NextResponse.json({ 
                success: true,
                message: 'Category created successfully',
                category
            }, { status: 201 });
        } catch (createError) {
            console.error('❌ Category creation failed:', createError.message);

            if (createError?.code === 11000) {
                return NextResponse.json({
                    success: false,
                    error: `Category \"${trimmedName}\" already exists`
                }, { status: 409 });
            }

            return NextResponse.json({ 
                success: false,
                error: createError.message.includes('timeout') 
                    ? 'Database is slow - your category may still be saving. Please refresh in a moment.'
                    : 'Failed to create category: ' + createError.message
            }, { status: 500 });
        }
    } catch (error) {
        console.error("❌ Error in POST handler:", error.message);
        
        return NextResponse.json({ 
            success: false,
            error: "Failed to create category: " + error.message 
        }, { status: 400 });
    }
}
