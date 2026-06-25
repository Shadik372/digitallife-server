import express from "express";
import Lesson from "../models/Lesson.js";
import LessonReport from "../models/LessonReport.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// ==========================================
// 🏠 HOME PAGE DYNAMIC ROUTES (Must be top)
// ==========================================
router.get("/home/featured", async (req, res) => {
  try {
    // 1. Try to find explicitly featured public lessons
    let featured = await Lesson.find({ visibility: "Public", isFeatured: true })
      .populate("creatorId", "name photoURL role isPremium")
      .limit(3); // 👈 Changed from 6 to 3

    // 2. SMART FALLBACK: If no lessons are explicitly featured yet,
    // automatically fetch the top 3 most liked public lessons instead.
    if (featured.length === 0) {
      featured = await Lesson.find({ visibility: "Public" })
        .populate("creatorId", "name photoURL role isPremium")
        .sort({ likesCount: -1 }) 
        .limit(3); // 👈 Changed from 6 to 3
    }

    res.json({ success: true, lessons: featured });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/home/most-saved", async (req, res) => {
  try {
    const mostSaved = await Lesson.find({ visibility: "Public" })
      .sort({ savesCount: -1 })
      .limit(6)
      .populate("creatorId", "name photoURL role isPremium");
    res.json({ success: true, lessons: mostSaved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 🛡️ ADMIN ROUTES (Must be above /:id)
// ==========================================
router.get("/admin/all", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admins only." });
    
    const lessons = await Lesson.find()
      .populate("creatorId", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/admin/reported", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admins only." });
    
    const reports = await LessonReport.find()
      .populate("lessonId", "title")
      .populate("reporterUserId", "name email")
      .sort({ createdAt: -1 });

    const groupedReports = reports.reduce((acc, report) => {
      const lessonId = report.lessonId?._id.toString();
      if (!lessonId) return acc;

      if (!acc[lessonId]) {
        acc[lessonId] = {
          lessonId,
          lessonTitle: report.lessonId.title,
          reports: [],
          reportCount: 0
        };
      }
      acc[lessonId].reports.push({
        reporterName: report.reporterUserId?.name,
        reporterEmail: report.reporterUserId?.email,
        reason: report.reason,
        date: report.createdAt
      });
      acc[lessonId].reportCount += 1;
      return acc;
    }, {});

    res.json({ success: true, reportedLessons: Object.values(groupedReports) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 🔍 GET ALL PUBLIC LESSONS (Search & Filter)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const { search, category, tone } = req.query;
    let query = { visibility: "Public" };

    if (search) query.title = { $regex: search, $options: "i" };
    if (category && category !== "All") query.category = category;
    if (tone && tone !== "All") query.emotionalTone = tone;

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
    const canCreatePremium = req.user.isPremium === true || req.user.role === "admin";
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

// Get all lessons for the logged-in user
router.get("/me/all", verifyToken, async (req, res) => {
  try {
    const lessons = await Lesson.find({ creatorId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 🆔 DYNAMIC ID ROUTES (MUST BE AT BOTTOM)
// ==========================================
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

router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found." });
    if (lesson.creatorId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }
    const updatedLesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, lesson: updatedLesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found." });
    }

    // 🛡️ Admin Override Logic
    const isOwner = lesson.creatorId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    // If they are neither the owner nor an admin, block them!
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized. You cannot delete this lesson." });
    }

    // If authorized, proceed with deletion
    await Lesson.findByIdAndDelete(req.params.id);

    // Optional but highly recommended: Also delete all reports associated with this lesson
    // so they don't clutter your database as "orphan" records.
    await LessonReport.deleteMany({ lessonId: req.params.id });

    res.json({ success: true, message: "Lesson deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle Like
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

// 🚩 Submit a Report
router.post("/:id/report", verifyToken, async (req, res) => {
  try {
    const { reason, reportedUserEmail } = req.body;
    const newReport = new LessonReport({
      lessonId: req.params.id,
      reporterUserId: req.user.id,
      reportedUserEmail,
      reason
    });
    await newReport.save();
    res.json({ success: true, message: "Lesson reported successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🛡️ Admin Actions for Specific Lesson
router.patch("/:id/feature", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admins only." });
    const lesson = await Lesson.findById(req.params.id);
    lesson.isFeatured = !lesson.isFeatured;
    await lesson.save();
    res.json({ success: true, isFeatured: lesson.isFeatured });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/:id/review", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admins only." });
    const lesson = await Lesson.findById(req.params.id);
    lesson.isReviewed = !lesson.isReviewed;
    await lesson.save();
    res.json({ success: true, isReviewed: lesson.isReviewed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/:id/ignore-reports", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admins only." });
    await LessonReport.deleteMany({ lessonId: req.params.id });
    res.json({ success: true, message: "Reports cleared." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;