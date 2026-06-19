import express from "express";
import SellerApplication from "../models/SellerApplication.js";
import User from "../models/User.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.js";

const router = express.Router();

// Buyer applies to become a seller
router.post("/apply", verifyToken, async (req, res) => {
  try {
    const { bio, portfolioLink } = req.body;
    
    // Check if user already has a pending or approved application
    const existingApp = await SellerApplication.findOne({ userId: req.user.id });
    if (existingApp && existingApp.status !== "rejected") {
      return res.status(400).json({ success: false, message: "Application already submitted." });
    }

    const newApp = new SellerApplication({
      userId: req.user.id,
      bio,
      portfolioLink
    });

    await newApp.save();
    res.status(201).json({ success: true, application: newApp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all pending applications
router.get("/applications", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const applications = await SellerApplication.find({ status: "pending" })
      .populate("userId", "name email photoURL");
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Approve or Reject an application
router.patch("/applications/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body; // Expects "approved" or "rejected"
    
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const application = await SellerApplication.findByIdAndUpdate(
      req.params.id,
      { status, reviewedBy: req.user.id },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    // If approved, update the user's role to "seller" and initialize their profile
    if (status === "approved") {
      await User.findByIdAndUpdate(application.userId, {
        role: "seller",
        sellerProfile: { bio: application.bio, earningsBalance: 0, totalSales: 0 }
      });
    }

    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;