import { auth } from "../lib/auth.js";

export const verifyToken = async (req, res, next) => {
  try {
    // Better Auth can extract the session directly from the incoming request headers
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    // Attach the user object (which includes role and isPremium) to the request
    req.user = session.user;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during authentication." });
  }
};