import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

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