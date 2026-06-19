import express from "express";
const router = express.Router();

// A simple test route to bypass everything
router.all("/apply", (req, res) => {
  console.log("Method received:", req.method);
  console.log("URL received:", req.originalUrl);
  res.json({ message: "Route reached!", method: req.method });
});

export default router;