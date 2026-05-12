import imagekit from "@/configs/imageKit";
import connectDB from '@/lib/mongodb';
import Rating from '@/models/Rating';
import Order from '@/models/Order';
import User from '@/models/User';
import { optionalFirebaseAuth } from '@/lib/firebase-auth-helper';


// POST: Customer adds a review with images
export async function POST(request) {
    try {
        await connectDB();
        
        // Firebase Auth
        const user = await optionalFirebaseAuth(request);
        const userId = user?.uid || null;

        if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const productId = formData.get('productId');
        const rating = Number(formData.get('rating'));
        const review = formData.get('review');
        const images = formData.getAll('images');

        if (!productId || !rating || !review) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if customer has purchased this product
        const purchasedOrder = await Order.findOne({
            userId,
            'orderItems.productId': productId,
            status: { $in: ['DELIVERED', 'SHIPPED', 'ORDER_PLACED'] }
        }).select('_id').lean();

        if (!purchasedOrder) {
            return Response.json({ 
                error: "You can only review products you have purchased" 
            }, { status: 403 });
        }

        // Upload images to ImageKit
        let imageUrls = [];
        if (images.length > 0) {
            imageUrls = await Promise.all(
                images.map(async (image) => {
                    const buffer = Buffer.from(await image.arrayBuffer());
                    const response = await imagekit.upload({
                        file: buffer,
                        fileName: `review_${Date.now()}_${image.name}`,
                        folder: "reviews"
                    });
                    return imagekit.url({
                        path: response.filePath,
                        transformation: [
                            { quality: "auto" },
                            { format: "webp" },
                            { width: "600" }
                        ]
                    });
                })
            );
        }

        // Create or update review (requires approval)
        const newReview = await Rating.findOneAndUpdate(
            { userId, productId },
            {
                rating,
                review,
                images: imageUrls,
                orderId: purchasedOrder._id.toString(),
                approved: false
            },
            { upsert: true, new: true }
        );

        // Populate user
        const user = await User.findById(userId).select('_id name image').lean();

        return Response.json({
            success: true,
            message: "Review submitted successfully and pending approval",
            review: { ...newReview.toObject(), user }
        });

    } catch (error) {
        console.error('Review submission error:', error);
        return Response.json({
            error: error.message || "Failed to submit review"
        }, { status: 500 });
    }
}

// GET: Fetch reviews for a product
export async function GET(request) {
    try {
        await connectDB();
        
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return Response.json({ error: "Product ID required" }, { status: 400 });
        }

        // Only show approved reviews to customers

        const reviews = await Rating.find({ 
            productId,
            approved: true 
        })
        .populate({
            path: 'userId',
            select: '_id name image email',
            model: 'User'
        })
        .sort({ createdAt: -1 })
        .lean();

                // Patch: Ensure each review has a user object for frontend compatibility
                const reviewsWithUser = reviews.map(r => {
                    let user = r.userId;
                    if (!user || typeof user !== 'object') {
                        user = { name: r.customerName || 'Unknown User', email: r.customerEmail || '' };
                    }
                    return { ...r, user };
                });
                return Response.json({ reviews: reviewsWithUser });

    } catch (error) {
        console.error('Fetch reviews error:', error);
        return Response.json({
            error: error.message || "Failed to fetch reviews"
        }, { status: 500 });
    }
}
