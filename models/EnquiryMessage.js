import mongoose from 'mongoose';

const EnquiryMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String, default: '', trim: true },
    productId: { type: String, default: null },
    image: { type: String, default: null },
    date: { type: String, default: null },
    time: { type: String, default: null },
    type: { type: String, default: 'Product Enquiry' },
    store: { type: String, default: null },
    source: { type: String, enum: ['product', 'appointment'], default: 'product' },
  },
  { timestamps: true }
);

EnquiryMessageSchema.index({ createdAt: -1 });
EnquiryMessageSchema.index({ email: 1, createdAt: -1 });

export default mongoose.models.EnquiryMessage || mongoose.model('EnquiryMessage', EnquiryMessageSchema);
