import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  description: String,
  shortDescription: String,
  AED: Number,
  price: Number,
  images: [String],
  category: String,
  sku: String,
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 0 },
  hasVariants: { type: Boolean, default: false },
  variants: { type: Array, default: [] },
  attributes: { type: Object, default: {} },
  hasBulkPricing: { type: Boolean, default: false },
  bulkPricing: { type: Array, default: [] },
  fastDelivery: { type: Boolean, default: false },
  allowReturn: { type: Boolean, default: true },
  allowReplacement: { type: Boolean, default: true },
  tags: { type: [String], default: [] },
  storeId: String,
  enableEnquiry: { type: Boolean, default: false },
  // Price Breakup fields
  goldType: { type: String, enum: ['yellow', 'white', 'rose', 'platinum'], default: null },
  goldWeight: { type: Number, default: 0 }, // in grams
  goldRate: { type: Number, default: 0 }, // per gram
  stoneWeight: { type: Number, default: 0 }, // in carats
  stonePrice: { type: Number, default: 0 },
  makingCharges: { type: Number, default: 0 },
}, { timestamps: true });

// Add indexes for better query performance
ProductSchema.index({ inStock: 1, createdAt: -1 });
ProductSchema.index({ category: 1, inStock: 1 });
ProductSchema.index({ storeId: 1, inStock: 1 });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ tags: 1 });
// Text index for basic search across common fields
try {
  ProductSchema.index({ name: 'text', description: 'text', shortDescription: 'text', category: 'text', tags: 'text' });
} catch (e) {
  // Ignore if index already exists or fails in certain environments
}

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);