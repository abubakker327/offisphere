const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  let token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token === "null" || token === "undefined" || token === "") {
    token = null;
  }

  if (!token && req.cookies?.offisphere_token) {
    token = req.cookies.offisphere_token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id,
      roles: payload.roles || [],
    };
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const authorize =
  (allowedRoles = []) =>
  (req, res, next) => {
    if (!allowedRoles.length) {
      return next();
    }

    const userRoles = req.user?.roles || [];
    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };

module.exports = { authenticate, authorize };
