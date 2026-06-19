import express from "express";
import Purchase from "../models/Purchase.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyRole } from "../middlewares/verifyRole.js";

const router = express.Router();

// Buyer: Get my purchases
router.get("/my-purchases", verifyToken, async (req, res) => {
  try {
    const purchases = await Purchase.find({ buyerId: req.user.id })
      .populate("lessonId")
      .sort({ purchasedAt: -1 });
    res.json({ success: true, purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seller/Admin: Get sales history
router.get("/my-sales", verifyToken, verifyRole(["seller", "admin"]), async (req, res) => {
  try {
    const sales = await Purchase.find({ sellerId: req.user.id })
      .populate("lessonId", "title price image")
      .populate("buyerId", "name email")
      .sort({ purchasedAt: -1 });
    res.json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;