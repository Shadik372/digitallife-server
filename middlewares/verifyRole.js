export const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    // Failsafe: Ensure verifyToken ran first
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized. User context missing." });
    }

    // Check if the user's role is in the array of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden. Requires one of the following roles: ${allowedRoles.join(", ")}` 
      });
    }

    next();
  };
};