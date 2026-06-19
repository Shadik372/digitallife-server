import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import favoriteRoutes from "./routes/favorites.routes.js";
import commentRoutes from "./routes/comments.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Mount Better Auth BEFORE express.json()
app.all("/api/auth/*", toNodeHandler(auth));

// Stripe webhook will go here later BEFORE express.json()

// Global JSON Parser
app.use(express.json());

// Basic Health Check Route
app.get("/", (req, res) => {
  res.send("Digital Life Lessons API is running...");
});

// Initialize Server
const startServer = async () => {
  await connectDB(); // Mongoose connects here
  
  // (Your future CRUD API routes will go here)

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/comments", commentRoutes);

};

startServer();