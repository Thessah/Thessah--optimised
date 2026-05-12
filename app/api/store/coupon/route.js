import { NextResponse } from "next/server";
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import Store from '@/models/Store';
import { requireFirebaseAuth } from '@/lib/firebase-auth-helper';

// GET - Fetch all coupons for the store
export async function GET(req) {
    try {
        await connectDB();
        
        const { uid: userId } = await requireFirebaseAuth(req);

        // Get store
        const store = await Store.findOne({ userId }).lean();

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Get all coupons for this store
        const coupons = await Coupon.find({ storeId: store._id.toString() })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ coupons }, { status: 200 });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
    }
}

// POST - Create a new coupon
export async function POST(req) {
    try {
        await connectDB();
        
        const { uid: userId } = await requireFirebaseAuth(req);

        // Get store
        const store = await Store.findOne({ userId }).lean();

        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        const body = await req.json();
        const {
            code,
            description,
            discount,
            discountType,
            minPrice,
            minProductCount,
            specificProducts,
            forNewUser,
            forMember,
            firstOrderOnly,
            oneTimePerUser,
            usageLimit,
            isPublic,
            expiresAt
        } = body;

        // Validate required fields
        if (!code || !description || discount === undefined || !discountType || !expiresAt) {
            return NextResponse.json({ 
                error: "Missing required fields: code, description, discount, discountType, expiresAt" 
            }, { status: 400 });
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();

        if (existingCoupon) {
            return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
        }

        // Create coupon
        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            description,
            discount: parseFloat(discount),
            discountType: discountType || 'percentage',
            minPrice: minPrice ? parseFloat(minPrice) : 0,
            minProductCount: minProductCount ? parseInt(minProductCount) : null,
            specificProducts: specificProducts || [],
            forNewUser: forNewUser || false,
            forMember: forMember || false,
            firstOrderOnly: firstOrderOnly || false,
            oneTimePerUser: oneTimePerUser || false,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            isPublic: isPublic !== undefined ? isPublic : true,
            isActive: true,
            storeId: store._id.toString(),
            expiresAt: new Date(expiresAt)
        });

        return NextResponse.json({ coupon }, { status: 201 });
    } catch (error) {
        console.error("Error creating coupon:", error);
        return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
    }
}
