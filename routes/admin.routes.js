import express from "express";
import User from "../models/User.js";
import Lesson from "../models/Lesson.js";
import Purchase from "../models/Purchase.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import SellerApplication from "../models/SellerApplication.js";

const router = express.Router();

// ==========================================
// 🛡️ ADMIN MIDDLEWARE
// ==========================================
// This runs AFTER verifyToken to ensure the user is an admin
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. Admin privileges required." 
    });
  }
  next();
};

// Apply both middlewares to EVERY route in this file
router.use(verifyToken, verifyAdmin);

// ==========================================
// 📊 1. PLATFORM STATISTICS (For the Admin Dashboard)
// ==========================================
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ isPremium: true });
    const totalLessons = await Lesson.countDocuments();
    const totalPurchases = await Purchase.countDocuments();

    // Calculate total platform revenue from marketplace sales
    const purchases = await Purchase.find();
    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      success: true,
      stats: {
        totalUsers,
        premiumUsers,
        totalLessons,
        totalPurchases,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 👥 2. USER MANAGEMENT
// ==========================================

// Get all users (with pagination/limits if needed later)
router.get("/users", async (req, res) => {
  try {
    // Exclude passwords or sensitive auth data if you aren't using Better Auth defaults
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change a user's role (e.g., promote someone to seller or admin)
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (!["buyer", "seller", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { role }, 
      { new: true }
    );

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 🛑 3. CONTENT MODERATION
// ==========================================

// Get ALL lessons (including Private ones that normal users can't see)
router.get("/lessons", async (req, res) => {
  try {
    const lessons = await Lesson.find()
      .populate("creatorId", "name email")
      .sort({ createdAt: -1 });
      
    res.json({ success: true, lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Force delete any lesson (Moderation Tool)
router.delete("/lessons/:id", async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found." });
    }
    res.json({ success: true, message: "Lesson deleted by admin." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 📝 4. SELLER APPLICATIONS
// ==========================================

// Get all pending applications
router.get("/applications", async (req, res) => {
  try {
    // Fetch from the new schema, and populate the user details for the frontend table
    const applications = await SellerApplication.find({ status: "pending" })
      .populate("userId", "name email photoURL") 
      .sort({ createdAt: -1 });
      
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve or Reject an application
router.patch("/applications/:id/:action", async (req, res) => {
  try {
    const { id, action } = req.params;
    
    const application = await SellerApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    if (action === "approve") {
      // 1. Mark application as approved
      application.status = "approved";
      application.reviewedBy = req.user.id;
      await application.save();

      // 2. Upgrade the actual User's role and transfer their bio!
      await User.findByIdAndUpdate(application.userId, { 
        role: "seller",
        "sellerProfile.bio": application.bio 
      });
      
      res.json({ success: true, message: "Seller approved successfully!" });
      
    } else if (action === "reject") {
      // Mark application as rejected, keep the user as a buyer
      application.status = "rejected";
      application.reviewedBy = req.user.id;
      await application.save();
      
      res.json({ success: true, message: "Seller application rejected." });
    } else {
      res.status(400).json({ success: false, message: "Invalid action." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;