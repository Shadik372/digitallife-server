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
    // Failsafe: if a Free user tries to submit 'Premium', override it to 'Free'
    const accessLevel = req.user.isPremium ? req.body.accessLevel : "Free";
    
    const newLesson = new Lesson({
      ...req.body,
      creatorId: req.user.id,
      accessLevel
    });
    
    const savedLesson = await newLesson.save();
    res.status(201).json({ success: true, lesson: savedLesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;