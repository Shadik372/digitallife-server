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
// STANDARD USER ROUTES
// ==========================================
router.get("/make-me-admin", async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: "test123@gmail.com" }, // Your exact email
      { role: "admin" },
      { new: true }
    );

    if (updatedUser) {
      res.send(`Success! ${updatedUser.email} is now an Admin. Go log out and log back in!`);
    } else {
      res.send("User not found!");
    }
  } catch (error) {
    res.status(500).send(error.message);
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