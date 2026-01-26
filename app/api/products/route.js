import connectDB from "@/lib/mongoose";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { name, description, shortDescription, AED, price, images, category, sku, inStock, hasVariants, variants, attributes, hasBulkPricing, bulkPricing, fastDelivery, allowReturn, allowReplacement, storeId, slug, enableEnquiry, goldType, goldWeight, goldRate, stoneWeight, stonePrice, makingCharges } = body;

        // Generate slug from name if not provided
        const productSlug = slug || name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        // Check if slug is unique
        const existing = await Product.findOne({ slug: productSlug });
        if (existing) {
            return NextResponse.json({ error: "Slug already exists. Please use a different product name." }, { status: 400 });
        }

        const product = await Product.create({
            name,
            slug: productSlug,
            description,
            shortDescription,
            AED,
            price,
            images,
            category,
            sku,
            inStock,
            hasVariants,
            variants,
            attributes,
            hasBulkPricing,
            bulkPricing,
            fastDelivery,
            allowReturn,
            allowReplacement,
            storeId,
            enableEnquiry,
            goldType,
            goldWeight,
            goldRate,
            stoneWeight,
            stonePrice,
            makingCharges,
        });

        return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Error creating product', details: error.message, stack: error.stack }, { status: 500 });
    }
}


export async function GET(request){
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sortBy');
        const limit = parseInt(searchParams.get('limit') || '50', 10); // increased default
        const offset = parseInt(searchParams.get('offset') || '0', 10);
        const fastDelivery = searchParams.get('fastDelivery');
        const storeId = searchParams.get('storeId');
        const category = searchParams.get('category');
        const tag = searchParams.get('tag');
        const q = searchParams.get('q');
        
        // Build query
        const query = {};
        if (fastDelivery === 'true') {
            query.fastDelivery = true;
        }
        if (storeId) {
            query.storeId = storeId;
        }
        if (category) {
            query.category = category;
        }
        if (tag) {
            query.tags = { $in: [tag] };
        }
        if (q && q.trim().length > 0) {
            const regex = new RegExp(q.trim(), 'i');
            query.$or = [
                { name: regex },
                { description: regex },
                { shortDescription: regex },
                { category: regex },
                { tags: regex },
            ];
        }
        
        // Optimized query with field selection
        let products = await Product.find(query)
            .select('name slug description shortDescription AED price images category sku inStock hasVariants variants attributes fastDelivery enableEnquiry stockQuantity createdAt tags goldType goldWeight goldRate stoneWeight stonePrice makingCharges')
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean()
            .exec();

        // DEBUG: Log all products to help diagnose missing products
        console.log('[API /api/products] Products returned:', products.map(p => ({ name: p.name, category: p.category, slug: p.slug })));

        // Add discount label and review stats if applicable
        const Rating = (await import('@/models/Rating')).default;
        products = await Promise.all(products.map(async product => {
            try {
                let label = null;
                let labelType = null;
                if (typeof product.AED === 'number' && typeof product.price === 'number' && product.AED > product.price) {
                    const discount = Math.round(((product.AED - product.price) / product.AED) * 100);
                    if (discount >= 50) {
                        label = `Min. ${discount}% Off`;
                        labelType = 'offer';
                    } else if (discount > 0) {
                        label = `${discount}% Off`;
                        labelType = 'offer';
                    }
                }

                // Fetch review stats
                const reviews = await Rating.find({ productId: String(product._id), approved: true }).select('rating').lean();
                const ratingCount = reviews.length;
                const averageRating = ratingCount > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount) : 0;

                return {
                    ...product,
                    label,
                    labelType,
                    ratingCount,
                    averageRating
                };
            } catch (err) {
                console.error('Error mapping product review stats:', err);
                return {
                    ...product,
                    label: null,
                    labelType: null,
                    ratingCount: 0,
                    averageRating: 0,
                    reviewError: err.message
                };
            }
        }));

        // Sort based on the sortBy parameter
        if (sortBy === 'orders') {
            // Placeholder: implement order-based sorting if you have order data
        } else if (sortBy === 'rating') {
            // Placeholder: implement rating-based sorting if you have rating data
        }

        return NextResponse.json({ products }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });
    } catch (error) {
        console.error('Error in products API:', error);
        if (error instanceof Error && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        return NextResponse.json({ error: "An internal server error occurred.", details: error.message, stack: error.stack }, { status: 500 });
    }
}