import express from "express";
import Favorite from "../models/Favorite.js";
import Lesson from "../models/Lesson.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Get all favorites for the logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .populate("lessonId")
      .sort({ savedAt: -1 });
    res.json({ success: true, favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle Favorite (Add/Remove)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { lessonId } = req.body;
    const existingFavorite = await Favorite.findOne({ userId: req.user.id, lessonId });

    if (existingFavorite) {
      // If it exists, remove it (Unsave)
      await Favorite.findByIdAndDelete(existingFavorite._id);
      await Lesson.findByIdAndUpdate(lessonId, { $inc: { savesCount: -1 } });
      return res.json({ success: true, message: "Removed from favorites", isSaved: false });
    } else {
      // If it doesn't exist, create it (Save)
      const newFavorite = new Favorite({ userId: req.user.id, lessonId });
      await newFavorite.save();
      await Lesson.findByIdAndUpdate(lessonId, { $inc: { savesCount: 1 } });
      return res.json({ success: true, message: "Added to favorites", isSaved: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;