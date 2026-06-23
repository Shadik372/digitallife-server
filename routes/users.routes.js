import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// ==========================================
// 🏠 HOME PAGE DYNAMIC ROUTES
// ==========================================
router.get("/home/top-contributors", async (req, res) => {
  try {
    const topUsers = await User.find({})
      .sort({ totalLessonsCreated: -1 })
      .limit(4)
      .select("name photoURL role totalLessonsCreated isPremium");
    res.json({ success: true, users: topUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 🛡️ ADMIN MANAGEMENT ROUTES
// ==========================================

// Get ALL lessons for the Admin Dashboard (Public & Private)
router.get("/admin/all", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized. Admins only." });
    }
    const lessons = await Lesson.find()
      .populate("creatorId", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle "Featured" Status
router.patch("/:id/feature", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admins only." });
    
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found." });

    lesson.isFeatured = !lesson.isFeatured;
    await lesson.save();
    
    res.json({ success: true, isFeatured: lesson.isFeatured });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle "Reviewed" Status
router.patch("/:id/review", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admins only." });
    
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found." });

    lesson.isReviewed = !lesson.isReviewed;
    await lesson.save();
    
    res.json({ success: true, isReviewed: lesson.isReviewed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// STANDARD USER ROUTES
// ==========================================
router.patch("/make-me-admin", verifyToken, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { role: "admin" },
      { new: true }
    );

    if (updatedUser) {
      res.json({ success: true, message: "Success! You are now an Admin. Please log out and log back in to apply the changes." });
    } else {
      res.status(404).json({ success: false, message: "User not found!" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current logged-in user profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile (name, photoURL only)
router.patch("/me", verifyToken, async (req, res) => {
  try {
    const { name, photoURL } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, photoURL },
      { new: true } // Returns the updated document
    );

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;