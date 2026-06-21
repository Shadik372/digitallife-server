import express from "express";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import SellerApplication from "../models/SellerApplication.js";

const router = express.Router();

const verifySellerOrAdmin = (req, res, next) => {
  if (req.user.role !== "seller" && req.user.role !== "admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Access Denied. Seller privileges required." 
    });
  }
  next();
};

router.get("/stats", verifyToken, verifySellerOrAdmin, async (req, res) => {
  try {
    // 1. Get the seller's profile data (Earnings & Total Sales)
    const user = await User.findById(req.user.id);

    // 2. Get recent sales where this exact user is the seller
    const recentSales = await Purchase.find({ sellerId: req.user.id })
      .populate("buyerId", "name") // Get the buyer's name
      .populate("lessonId", "title") // Get the lesson's title
      .sort({ createdAt: -1 })
      .limit(5); // Only show the 5 most recent sales

    res.json({
      success: true,
      stats: {
        totalEarnings: user.sellerProfile?.earningsBalance || 0,
        totalSales: user.sellerProfile?.totalSales || 0
      },
      recentSales: recentSales
    });
  } catch (error) {
    console.error("Seller Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 🚀 BECOME A SELLER (The Apply Route)
// ==========================================
router.post("/apply", verifyToken, async (req, res) => {
  try {
    // Optional: You can extract bio and portfolioLink if your frontend sends them
    const { bio = "I want to share my knowledge!", portfolioLink = "" } = req.body;

    // Check if they already have a pending application to prevent spam
    const existingApp = await SellerApplication.findOne({ userId: req.user.id, status: "pending" });
    if (existingApp) {
      return res.status(400).json({ success: false, message: "You already have a pending application." });
    }

    // Create the new application document
    await SellerApplication.create({
      userId: req.user.id,
      bio,
      portfolioLink
    });
    
    res.json({ success: true, message: "Application submitted! An admin will review it shortly." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;