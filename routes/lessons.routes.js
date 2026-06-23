import express from "express";
import Lesson from "../models/Lesson.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// ==========================================
// 🔍 GET ALL PUBLIC LESSONS (With Search & Filters!)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { search, category, tone } = req.query;
    
    // Start with a base query: Only show Public lessons
    let query = { visibility: "Public" };

    // If the user typed in the search bar, filter by title (case-insensitive)
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    
    // If they picked a specific category
    if (category && category !== "All") {
      query.category = category;
    }
    
    // If they picked a specific emotional tone
    if (tone && tone !== "All") {
      query.emotionalTone = tone;
    }

    const lessons = await Lesson.find(query)
      .populate("creatorId", "name photoURL role isPremium")
      .sort({ createdAt: -1 });

    res.json({ success: true, lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ✍️ CREATE A NEW LESSON
// ==========================================
router.post("/", verifyToken, async (req, res) => {
  try {
    // Only Sellers and Admins can lock lessons behind the Premium paywall
    const canCreatePremium = req.user.role === "seller" || req.user.role === "admin";
    const accessLevel = canCreatePremium ? req.body.accessLevel : "Free";

    const creatorId = req.user.id || req.user._id || req.user.userId;
    if (!creatorId) return res.status(400).json({ success: false, message: "Could not identify User ID." });

    const newLesson = new Lesson({ ...req.body, creatorId, accessLevel });
    const savedLesson = await newLesson.save();
    
    res.status(201).json({ success: true, lesson: savedLesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a single lesson by ID
router.get("/:id", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate("creatorId", "name photoURL role isPremium sellerProfile");
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });
    res.json({ success: true, lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle Like on a lesson
router.patch("/:id/like", verifyToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    const hasLiked = lesson.likes.includes(req.user.id);
    if (hasLiked) {
      lesson.likes = lesson.likes.filter(id => id.toString() !== req.user.id);
      lesson.likesCount -= 1;
    } else {
      lesson.likes.push(req.user.id);
      lesson.likesCount += 1;
    }

    await lesson.save();
    res.json({ success: true, likesCount: lesson.likesCount, hasLiked: !hasLiked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all lessons for the logged-in user
router.get("/me/all", verifyToken, async (req, res) => {
  try {
    const lessons = await Lesson.find({ creatorId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a lesson
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found." });

    // Verify ownership or admin role
    if (lesson.creatorId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized to edit this lesson." });
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, lesson: updatedLesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a lesson
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found." });

    // Verify ownership or admin role
    if (lesson.creatorId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this lesson." });
    }

    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Lesson deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;