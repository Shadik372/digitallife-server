import express from "express";
import User from "../models/User.js";
import Lesson from "../models/Lesson.js"; 
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// ==========================================
// 🏠 HOME PAGE DYNAMIC ROUTES
// ==========================================
router.get("/home/top-contributors", async (req, res) => {
  try {
    // 🚀 THE MONGODB AGGREGATION PIPELINE
    // This calculates everything inside the database in 1 single query
    const topUsers = await Lesson.aggregate([
      // 1. Group all lessons by their creatorId and count them
      { 
        $group: { 
          _id: "$creatorId", 
          totalLessonsCreated: { $sum: 1 } 
        } 
      },
      // 2. Sort the groups from highest count to lowest
      { 
        $sort: { totalLessonsCreated: -1 } 
      },
      // 3. Keep only the top 4 creators to save memory
      { 
        $limit: 4 
      },
      // 4. "JOIN" with the Users collection to grab their profile details
      { 
        $lookup: {
          from: "users", // MongoDB automatically lowercases and pluralizes your "User" model name
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      // 5. Flatten the joined array
      { 
        $unwind: "$userInfo" 
      },
      // 6. Format the final output to exactly what the frontend expects
      { 
        $project: {
          _id: 1,
          totalLessonsCreated: 1,
          name: "$userInfo.name",
          photoURL: "$userInfo.photoURL",
          role: "$userInfo.role",
          isPremium: "$userInfo.isPremium"
        }
      }
    ]);

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