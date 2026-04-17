import { ensureImageKit } from "@/configs/imageKit";
import { NextResponse } from "next/server";
import { auth as adminAuth } from '@/lib/firebase-admin';
import authSeller from '@/middlewares/authSeller';

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const storeId = await authSeller(decodedToken.uid);
        if (!storeId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const imagekit = ensureImageKit();
        const authenticationParameters = imagekit.getAuthenticationParameters();
        return NextResponse.json(authenticationParameters, { status: 200 });
    } catch (error) {
        console.error("❌ Error generating ImageKit auth:", error.message);
        return NextResponse.json({ 
            error: "Failed to generate authentication",
            details: error.message 
        }, { status: 500 });
    }
}
