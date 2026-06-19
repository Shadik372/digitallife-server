import express from "express";
import Stripe from "stripe";
import User from "../models/User.js";
import Lesson from "../models/Lesson.js";
import Purchase from "../models/Purchase.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// ==========================================
// 1. STRIPE WEBHOOK (Must use express.raw)
// ==========================================
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verify the webhook signature to ensure it came from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payments
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      // Flow A: Platform Premium Subscription
      if (session.metadata.type === "premium_subscription") {
        await User.findByIdAndUpdate(session.metadata.userId, { isPremium: true });
        console.log(`User ${session.metadata.userId} upgraded to Premium.`);
      }

      // Flow B: Individual Lesson Purchase (Marketplace)
      if (session.metadata.type === "lesson_purchase") {
        const { lessonId, buyerId, sellerId } = session.metadata;

        // 1. Create the purchase record
        await Purchase.create({
          buyerId,
          lessonId,
          sellerId,
          amount: session.amount_total / 100, // Convert paisa back to BDT
          stripeSessionId: session.id
        });

        // 2. Increment the lesson's purchase count
        await Lesson.findByIdAndUpdate(lessonId, { $inc: { purchaseCount: 1 } });

        // 3. Increment the seller's earnings and total sales
        await User.findByIdAndUpdate(sellerId, {
          $inc: { 
            "sellerProfile.earningsBalance": session.amount_total / 100,
            "sellerProfile.totalSales": 1 
          }
        });

        console.log(`Lesson ${lessonId} purchased by ${buyerId}.`);
      }
    } catch (error) {
      console.error("Error processing webhook metadata:", error);
      return res.status(500).send("Database Update Error");
    }
  }

  res.status(200).json({ received: true });
});

// ==========================================
// 2. CREATE PREMIUM CHECKOUT SESSION
// ==========================================
// Note: We inject express.json() here because the global parser hasn't run yet
router.post("/create-checkout-session", express.json(), verifyToken, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: { name: "Digital Life Lessons - Premium Lifetime" },
            unit_amount: 1500 * 100, // Stripe expects the smallest currency unit (paisa/cents)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        type: "premium_subscription",
        userId: req.user.id,
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. CREATE LESSON CHECKOUT SESSION
// ==========================================
router.post("/create-lesson-checkout-session", express.json(), verifyToken, async (req, res) => {
  try {
    const { lessonId } = req.body;
    const lesson = await Lesson.findById(lessonId);

    if (!lesson || !lesson.isForSale) {
      return res.status(404).json({ success: false, message: "Lesson not available for sale." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: { name: `Lesson: ${lesson.title}` },
            unit_amount: lesson.price * 100, 
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        type: "lesson_purchase",
        lessonId: lesson._id.toString(),
        buyerId: req.user.id,
        sellerId: lesson.creatorId.toString(),
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;