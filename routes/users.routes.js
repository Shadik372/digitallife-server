import express from "express";
import User from "../models/User.js";
import Lesson from "../models/Lesson.js"; 
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();


router.get("/home/top-contributors", async (req, res) => {
  try {
    const topUsers = await User.aggregate([
      {
        $lookup: {
          from: "lessons", // MongoDB automatically lowercases and pluralizes "Lesson" to "lessons"
          localField: "_id",
          foreignField: "creatorId",
          as: "createdLessons" // Puts all their lessons into an array called createdLessons
        }
      },
      // 2. Format the data and COUNT the size of that array instantly
      {
        $project: {
          _id: 1,
          name: 1,
          photoURL: 1,
          role: 1,
          isPremium: 1,
          totalLessonsCreated: { $size: "$createdLessons" } // Counts the array!
        }
      },
      // 3. 🛡️ Filter out any users who have 0 lessons (so we only show active contributors)
      {
        $match: { totalLessonsCreated: { $gt: 0 } }
      },
      // 4. Sort from highest amount of lessons to lowest
      {
        $sort: { totalLessonsCreated: -1 }
      },
      // 5. Limit to the top 4 to fit perfectly in your frontend grid
      {
        $limit: 4
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