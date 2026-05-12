import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { requireFirebaseAuth } from '@/lib/firebase-auth-helper';

// Update order status and tracking details
export async function PUT(request, { params }) {
    try {
        await connectDB();
        
        // Firebase Auth
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const idToken = authHeader.split(" ")[1];
        const { getAuth } = await import('firebase-admin/auth');
        const { initializeApp, applicationDefault, getApps } = await import('firebase-admin/app');
        if (getApps().length === 0) {
            initializeApp({ credential: applicationDefault() });
        }
        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(idToken);
        } catch (e) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = decodedToken.uid;
        const storeId = await authSeller(userId);
        const { orderId } = await params;

        const { status, trackingId, trackingUrl, courier } = await request.json();

        // Verify the order belongs to this store
        const existingOrder = await Order.findOne({
            _id: orderId,
            storeId: storeId
        })
        .populate({
            path: 'userId',
            select: 'email name'
        })
        .populate({
            path: 'orderItems.productId',
            model: 'Product'
        })
        .lean();

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
        }

        // Prepare update data
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (trackingId !== undefined) updateData.trackingId = trackingId;
        if (trackingUrl !== undefined) updateData.trackingUrl = trackingUrl;
        if (courier !== undefined) updateData.courier = courier;

        // Update the order
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        ).lean();

        // Send email notification if status changed or tracking added
        if (status || trackingId) {
            try {
                // Call email notification API
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/order-status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        orderId: updatedOrder._id.toString(),
                        email: existingOrder.userId.email,
                        customerName: existingOrder.userId.name,
                        status: updatedOrder.status,
                        trackingId: updatedOrder.trackingId,
                        trackingUrl: updatedOrder.trackingUrl,
                        courier: updatedOrder.courier,
                        orderItems: existingOrder.orderItems
                    })
                });

                // Send SMS notification if phone number exists
                if (existingOrder.shippingAddress?.phone) {
                    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/order-sms`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            phoneNumber: existingOrder.shippingAddress.phone,
                            orderId: updatedOrder._id.toString(),
                            customerName: existingOrder.userId.name || existingOrder.shippingAddress.name,
                            status: updatedOrder.status,
                            totalAmount: existingOrder.total,
                            trackingId: updatedOrder.trackingId,
                            trackingUrl: updatedOrder.trackingUrl,
                            courier: updatedOrder.courier
                        })
                    }).catch(smsError => {
                        console.error('SMS notification failed:', smsError);
                    });
                }
            } catch (emailError) {
                console.error('Email notification failed:', emailError);
                // Continue even if email fails
            }
        }

        return NextResponse.json({ 
            success: true, 
            order: updatedOrder,
            message: 'Order updated successfully'
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 400 });
    }
}

// Delete order
export async function DELETE(request, { params }) {
    try {
        await connectDB();
        
        // Firebase Auth
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const idToken = authHeader.split(" ")[1];
        const { getAuth } = await import('firebase-admin/auth');
        const { initializeApp, applicationDefault, getApps } = await import('firebase-admin/app');
        if (getApps().length === 0) {
            initializeApp({ credential: applicationDefault() });
        }
        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(idToken);
        } catch (e) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = decodedToken.uid;
        const storeId = await authSeller(userId);
        const { orderId } = await params;

        // Verify the order belongs to this store
        const existingOrder = await Order.findOne({
            _id: orderId,
            storeId: storeId
        }).lean();

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
        }

        // Delete the order
        await Order.findByIdAndDelete(orderId);

        return NextResponse.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message || 'Failed to delete order' }, { status: 400 });
    }
}
