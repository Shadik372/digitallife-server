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
    validate: {
      validator: function(value) {
        // 1. If the lesson is NOT for sale (Free), any price (like 0) is completely fine!
        if (!this.isForSale) return true;
        
        // 2. If it IS for sale, enforce the Stripe minimum and your maximum
        return value >= 100 && value <= 5000;
      },
      message: "If a lesson is for sale, the price must be between 100 BDT and 5000 BDT to meet Stripe limits."
    }
  },
  purchaseCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isReviewed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Lesson", lessonSchema);