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
  barcode: String,
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
  targetAudience: {
    type: [String],
    enum: ['men', 'women', 'kids'],
    default: [],
  },
  storeId: String,
  enableEnquiry: { type: Boolean, default: false },
  showBuyButton: { type: Boolean, default: false },
  showEnquiryButton: { type: Boolean, default: true },
  // Price Breakup fields
  goldType: { type: String, enum: ['yellow', 'white', 'rose', 'platinum'], default: null },
  goldWeight: { type: Number, default: 0 }, // in grams
  goldRate: { type: Number, default: 0 }, // per gram
  stoneWeight: { type: Number, default: 0 }, // in carats
  stonePrice: { type: Number, default: 0 },
  makingCharges: { type: Number, default: 0 },
  metalDetails: {
    type: [{ label: { type: String, default: '' }, value: { type: String, default: '' } }],
    default: [],
  },
  generalDetails: {
    type: [{ label: { type: String, default: '' }, value: { type: String, default: '' } }],
    default: [],
  },
}, { timestamps: true });

// Add indexes for better query performance
ProductSchema.index({ inStock: 1, createdAt: -1 });
ProductSchema.index({ category: 1, inStock: 1 });
ProductSchema.index({ storeId: 1, inStock: 1 });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ targetAudience: 1 });
// Text index for basic search across common fields
try {
  ProductSchema.index({ name: 'text', description: 'text', shortDescription: 'text', category: 'text', tags: 'text' });
} catch (e) {
  // Ignore if index already exists or fails in certain environments
}

const ExistingProductModel = mongoose.models.Product;

// Hot-reload safeguard: if model is already compiled, ensure barcode path exists.
if (ExistingProductModel && !ExistingProductModel.schema.path('barcode')) {
  ExistingProductModel.schema.add({ barcode: String });
}

export default ExistingProductModel || mongoose.model("Product", ProductSchema);