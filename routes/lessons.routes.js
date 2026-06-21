import express from "express";
import Lesson from "../models/Lesson.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Get all public lessons (Accessible to everyone)
router.get("/", async (req, res) => {
  try {
    const lessons = await Lesson.find({ visibility: "Public" })
      .populate("creatorId", "name photoURL role isPremium")
      .sort({ createdAt: -1 }); // Newest first

    res.json({ success: true, lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new lesson (Requires login)
router.post("/", verifyToken, async (req, res) => {
  try {
    // --- DIAGNOSTIC LOGS ---
    console.log("User trying to create lesson:", req.user);
    console.log("Lesson Data received:", req.body);
    // -----------------------

    // Failsafe: if a Free user tries to submit 'Premium', override it to 'Free'
    const accessLevel = req.user.isPremium ? req.body.accessLevel : "Free";

    // Bulletproof ID extraction (handles id, _id, or userId)
    const creatorId = req.user.id || req.user._id || req.user.userId;

    if (!creatorId) {
      return res.status(400).json({ success: false, message: "Server could not identify your User ID." });
    }

    const newLesson = new Lesson({
      ...req.body,
      creatorId: creatorId,
      accessLevel
    });

    const savedLesson = await newLesson.save();
    res.status(201).json({ success: true, lesson: savedLesson });
  } catch (error) {
    console.error("Lesson Creation Error:", error);
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