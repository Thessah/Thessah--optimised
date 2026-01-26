import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import authSeller from "@/middlewares/authSeller";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    let userId = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split(" ")[1];
      const { getAuth } = await import("firebase-admin/auth");
      const { initializeApp, applicationDefault, getApps } = await import("firebase-admin/app");
      if (getApps().length === 0) {
        initializeApp({ credential: applicationDefault() });
      }
      try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        userId = decodedToken.uid;
      } catch (e) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
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
