import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import authSeller from "@/middlewares/authSeller";
import { optionalFirebaseAuth } from "@/lib/firebase-auth-helper";

export async function POST(request) {
  try {
    const user = await optionalFirebaseAuth(request);
    const userId = user?.uid || null;
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const storeId = await authSeller(userId);
    if (!storeId) return Response.json({ error: "Not authorized as seller" }, { status: 401 });

    const { productId } = await request.json();
    if (!productId) {
      return Response.json({ error: "Product ID is required" }, { status: 400 });
    }

    await dbConnect();

    const product = await Product.findById(productId);
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.storeId !== storeId) {
      return Response.json({ error: "Unauthorized to modify this product" }, { status: 403 });
    }

    product.enableEnquiry = !product.enableEnquiry;
    await product.save();

    return Response.json({
      message: product.enableEnquiry ? "Enquiry enabled" : "Enquiry disabled",
      enableEnquiry: product.enableEnquiry,
    });
  } catch (error) {
    console.error("Error toggling enquiry:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
