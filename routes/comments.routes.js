import express from "express";
import Comment from "../models/Comment.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Get comments for a specific lesson
router.get("/:lessonId", async (req, res) => {
  try {
    const comments = await Comment.find({ lessonId: req.params.lessonId })
      .populate("userId", "name photoURL role")
      .sort({ createdAt: -1 });
    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a comment
router.post("/", verifyToken, async (req, res) => {
  try {
    const { lessonId, text } = req.body;
    const newComment = new Comment({
      lessonId,
      userId: req.user.id,
      text
    });
    
    await newComment.save();
    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;