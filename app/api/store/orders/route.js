import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Address from '@/models/Address';
import { requireFirebaseAuth } from '@/lib/firebase-auth-helper';

// Debug log helper
function debugLog(...args) {
    try { console.log('[ORDER API DEBUG]', ...args); } catch {}
}



// Update seller order status
export async function POST(request) {
    try {
        await connectDB();
        
        const { uid: userId } = await requireFirebaseAuth(request);
        const storeId = await authSeller(userId)
        if(!storeId){
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        const {orderId, status } = await request.json()

        await Order.findOneAndUpdate(
            { _id: orderId, storeId },
            { status }
        );

        return NextResponse.json({message: "Order Status updated"})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Get all orders for a seller
export async function GET(request){
    console.log('[ORDER API ROUTE] Route hit');
    try {
        await connectDB();
        
        const { uid: userId } = await requireFirebaseAuth(request);
        debugLog('userId from Firebase:', userId);
        const storeId = await authSeller(userId)
        debugLog('storeId from authSeller:', storeId);
        if(!storeId){
            debugLog('Not authorized: no storeId');
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        const orders = await Order.find({ storeId })
            .populate('addressId')
            .populate({
                path: 'orderItems.productId',
                model: 'Product'
            })
            .sort({ createdAt: -1 })
            .lean();
        
        debugLog('orders found:', orders.length);
        
        // Manually populate userId since it's a String-type _id
        for (let order of orders) {
            if (order.userId && !order.isGuest) {
                const user = await User.findById(order.userId).lean();
                if (user && (user.name || user.email)) {
                    // User has data in database
                    order.userId = user;
                    debugLog('User populated from DB for order:', order._id, 'User:', { name: user.name, email: user.email });
                } else {
                    // User exists but has no data, or doesn't exist - try Firebase
                    debugLog('User missing data in DB, fetching from Firebase for:', order.userId);
                    try {
                        const firebaseUser = await getAuth().getUser(order.userId);
                        const userData = {
                            _id: order.userId,
                            name: firebaseUser.displayName || '',
                            email: firebaseUser.email || '',
                            image: firebaseUser.photoURL || ''
                        };
                        order.userId = userData;
                        // Update database with Firebase data
                        await User.findByIdAndUpdate(userData._id, userData, { upsert: true });
                        debugLog('User synced from Firebase:', userData);
                    } catch (fbError) {
                        debugLog('Firebase user fetch failed:', fbError.message);
                        order.userId = user || { _id: order.userId, name: 'Unknown', email: '' };
                    }
                }
            }
        }
        
        if (orders.length > 0) {
            debugLog('First order after population:', {
                _id: orders[0]._id,
                userId: orders[0].userId,
                userIdType: typeof orders[0].userId,
                shippingAddress: orders[0].shippingAddress,
                isGuest: orders[0].isGuest
            });
        }

        return NextResponse.json({orders})
    } catch (error) {
        console.error('[ORDER API ERROR]', error);
        debugLog('API error:', error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}