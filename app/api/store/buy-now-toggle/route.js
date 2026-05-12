import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import authSeller from "@/middlewares/authSeller";
import { requireFirebaseAuth } from "@/lib/firebase-auth-helper";

export async function POST(request) {
  try {
    const { uid: userId } = await requireFirebaseAuth(request);

    const storeId = await authSeller(userId);
    if (!storeId) {
      return Response.json({ error: "Not authorized as seller" }, { status: 401 });
    }

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

    product.showBuyButton = product.showBuyButton === false ? true : false;
    await product.save();

    return Response.json({
      message: product.showBuyButton ? "Buy Now enabled" : "Buy Now disabled",
      showBuyButton: product.showBuyButton,
    });
  } catch (error) {
    console.error("Error toggling buy now:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
