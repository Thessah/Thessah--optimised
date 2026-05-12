import authSeller from "../../../../middlewares/authSeller";
import imagekit from "../../../../configs/imageKit";
import connectDB from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import Rating from '../../../../models/Rating';
import User from '../../../../models/User';
import { requireFirebaseAuth } from '../../../../lib/firebase-auth-helper';


// GET: Fetch all reviews for store's products
export async function GET(request) {
    try {
        await connectDB();
        
        let userId;
        try {
            const user = await requireFirebaseAuth(request);
            userId = user.uid;
        } catch (err) {
            return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const storeId = await authSeller(userId);
        if (!storeId) {
            return Response.json({ error: "Not authorized" }, { status: 401 });
        }

        // Get all products for this store
        const products = await Product.find({ storeId }).lean();
        const productIds = products.map(p => p._id.toString());
        
        // Get ratings for these products
        const ratings = await Rating.find({ productId: { $in: productIds } })
            .populate({
                path: 'userId',
                select: '_id name email image'
            })
            .sort({ createdAt: -1 })
            .lean();
        
        // Attach ratings to products

        // Patch: Ensure each rating has a user object with name/email fallback
        const ratingsWithUser = ratings.map(r => {
            let user = r.userId;
            if (!user || typeof user !== 'object') {
                // fallback if population failed
                user = { name: r.customerName || 'Unknown User', email: r.customerEmail || '' };
            }
            return { ...r, user };
        });

        const productsWithRatings = products.map(product => ({
            ...product,
            rating: ratingsWithUser.filter(r => r.productId === product._id.toString())
        }));

        return Response.json({ products: productsWithRatings });

    } catch (error) {
        console.error('Fetch store reviews error:', error);
        return Response.json({
            error: error.message || "Failed to fetch reviews"
        }, { status: 500 });
    }
}

// POST: Store manually adds a review for a product
export async function POST(request) {
    try {
        await connectDB();
        
        let userId;
        try {
            const user = await requireFirebaseAuth(request);
            userId = user.uid;
        } catch (err) {
            return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const storeId = await authSeller(userId);
        if (!storeId) {
            return Response.json({ error: "Not authorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const productId = formData.get('productId');
        const rating = Number(formData.get('rating'));
        const review = formData.get('review');
        const customerName = formData.get('customerName');
        const customerEmail = formData.get('customerEmail');
        const images = formData.getAll('images');

        if (!productId || !rating || !review || !customerName || !customerEmail) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Validate productId
        if (!productId || typeof productId !== 'string' || !productId.match(/^[a-fA-F0-9]{24}$/)) {
            console.error('Invalid or missing productId:', productId);
            return Response.json({ error: "Product ID required or invalid format" }, { status: 400 });
        }

        // Verify product belongs to this store
        let product;
        try {
            product = await Product.findOne({
                _id: productId,
                storeId
            }).lean();
        } catch (err) {
            console.error('Product.findOne error:', err, 'productId:', productId);
            return Response.json({ error: "Invalid productId format" }, { status: 400 });
        }

        if (!product) {
            return Response.json({ error: "Product not found or not authorized" }, { status: 403 });
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

        // Find or create user for this email
        let user = await User.findOne({ email: customerEmail }).lean();

        if (!user) {
            // Create a placeholder user
            user = await User.create({
                _id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email: customerEmail,
                name: customerName,
                image: '/placeholder-avatar.png'
            });
        }

        // Create review (manually added reviews are auto-approved)
        const newReview = await Rating.create({
            userId: user._id.toString(),
            productId,
            rating,
            review,
            images: imageUrls,
            approved: true
        });

        // Populate user
        const populatedReview = await Rating.findById(newReview._id)
            .populate({
                path: 'userId',
                select: '_id name image'
            })
            .lean();

        return Response.json({
            success: true,
            message: "Review added successfully",
            review: populatedReview
        });

    } catch (error) {
        console.error('Manual review submission error:', error);
        return Response.json({
            error: error.message || "Failed to submit review"
        }, { status: 500 });
    }
}
