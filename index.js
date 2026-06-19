import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

// Import all routes
import userRoutes from "./routes/users.routes.js";
import lessonRoutes from "./routes/lessons.routes.js";
import favoriteRoutes from "./routes/favorites.routes.js";
import commentRoutes from "./routes/comments.routes.js";
import sellerRoutes from "./routes/sellers.routes.js";
import purchaseRoutes from "./routes/purchases.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

app.all("/api/auth/*", toNodeHandler(auth));

// Basic Health Check Route
app.get("/", (req, res) => {
  res.send("Digital Life Lessons API is running...");
});

const startServer = async () => {
  await connectDB();
  
  // 1. Mount Payment Routes FIRST (Webhook needs raw body)
  app.use("/api/payment", paymentRoutes);

  // 2. Global JSON Parser for all subsequent routes
  app.use(express.json());

  // 3. Mount standard CRUD routes
  app.use("/api/users", userRoutes);
  app.use("/api/lessons", lessonRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/sellers", sellerRoutes);
  app.use("/api/purchases", purchaseRoutes);

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();