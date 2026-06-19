import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  stripeSessionId: { type: String },
  purchasedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Purchase", purchaseSchema);