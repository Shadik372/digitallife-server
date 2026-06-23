import express from "express";
import User from "../models/User.js";
import Lesson from "../models/Lesson.js"; // 👈 Required for the live counting!
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// ==========================================
// 🏠 HOME PAGE DYNAMIC ROUTES
// ==========================================
router.get("/home/top-contributors", async (req, res) => {
  try {
    // 1. Fetch all users from the database
    const users = await User.find({}).lean();
    
    // 2. LIVE COUNT: Go through every user and count their exact number of lessons
    // This retroactively fixes any missing numbers!
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const count = await Lesson.countDocuments({ creatorId: user._id });
        return { ...user, totalLessonsCreated: count };
      })
    );

    // 3. Sort them by whoever has the most lessons, and slice the top 4
    const topUsers = usersWithCounts
      .sort((a, b) => b.totalLessonsCreated - a.totalLessonsCreated)
      .slice(0, 4)
      .map(user => ({
        _id: user._id,
        name: user.name,
        photoURL: user.photoURL,
        role: user.role,
        isPremium: user.isPremium,
        totalLessonsCreated: user.totalLessonsCreated
      }));

    res.json({ success: true, users: topUsers });
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