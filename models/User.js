import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photoURL: { type: String },
  role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
  isPremium: { type: Boolean, default: false },
  sellerProfile: {
    bio: String,
    earningsBalance: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);