import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  emotionalTone: { type: String, required: true },
  image: { type: String },
  visibility: { type: String, enum: ["Public", "Private"], default: "Public" },
  accessLevel: { type: String, enum: ["Free", "Premium"], default: "Free" },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likesCount: { type: Number, default: 0 },
  savesCount: { type: Number, default: 0 },
  isForSale: { type: Boolean, default: false },
 price: { 
    type: Number, 
    default: 0,
    min: [100, "Price must be at least 100 BDT to meet Stripe minimums"],
    max: [5000, "Price cannot exceed 5000 BDT"] 
  },
  purchaseCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isReviewed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Lesson", lessonSchema);