const jwt = require("jsonwebtoken");

/**
 * Guards routes that require a valid JWT.
 * Send header: Authorization: Bearer <your_token_here>
 *
 * Sets req.user = { id: "<mongo user id string>" }
 */
async function protect(req, res, next) {
  try {
    let token;

    const authHeader = req.headers.authorization || "";

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        message: "Server configuration error: JWT secret missing.",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        message: "Invalid token payload.",
      });
    }

    req.user = { id: decoded.id };

    return next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    return next(err);
  }
}

module.exports = {
  protect,
};
