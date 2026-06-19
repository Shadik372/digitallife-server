import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Stripe webhook must use raw body parsing, so we will add it here later BEFORE express.json()

app.use(express.json());

// Basic Health Check Route
app.get("/", (req, res) => {
  res.send("Digital Life Lessons API is running...");
});

// Initialize Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();