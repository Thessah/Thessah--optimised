import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { requireFirebaseAuth } from '@/lib/firebase-auth-helper';

// Get all customers for a store with their order statistics

export async function GET(request) {
    try {
        await connectDB();
        
        const { uid: userId } = await requireFirebaseAuth(request);
        const storeId = await authSeller(userId);

        // Get all orders for this store
        const orders = await Order.find({ storeId })
            .populate({
                path: 'userId',
                select: '_id name email image'
            })
            .populate({
                path: 'orderItems.productId',
                model: 'Product'
            })
            .sort({ createdAt: -1 })
            .lean();

        // Group orders by customer and calculate statistics
        const customerMap = new Map();

        orders.forEach(order => {
            // If guest order, use guest info
            let customerId, name, email, image, isGuest = false;
            if (order.isGuest) {
                customerId = `guest-${order.guestEmail || order._id}`;
                name = order.guestName || 'Guest';
                email = order.guestEmail || 'No email';
                image = null;
                isGuest = true;
            } else {
                customerId = order.userId;
                name = order.userId?.name || 'Unknown Customer';
                email = order.userId?.email || 'No email';
                image = order.userId?.image || null;
            }

            if (!customerMap.has(customerId)) {
                customerMap.set(customerId, {
                    id: customerId,
                    name,
                    email,
                    image,
                    isGuest,
                    totalOrders: 0,
                    totalSpent: 0,
                    firstOrderDate: order.createdAt,
                    lastOrderDate: order.createdAt,
                    orders: []
                });
            }

            const customer = customerMap.get(customerId);
            customer.totalOrders += 1;
            customer.totalSpent += order.total;

            // Convert orderItems to items array
            const items = order.orderItems.map(item => ({
                name: item.productId?.name || 'Product',
                price: item.price,
                quantity: item.quantity
            }));

            customer.orders.push({
                id: order._id.toString(),
                total: order.total,
                status: order.status,
                createdAt: order.createdAt,
                items: JSON.stringify(items)
            });

            // Update first and last order dates
            if (new Date(order.createdAt) < new Date(customer.firstOrderDate)) {
                customer.firstOrderDate = order.createdAt;
            }
            if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
                customer.lastOrderDate = order.createdAt;
            }
        });

        // Convert map to array and sort by total spent (descending)
        const customers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);

        return NextResponse.json({ customers });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
