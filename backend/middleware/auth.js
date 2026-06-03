const jwt = require("jsonwebtoken");
const db = require("../config/db");

const JWT_SECRET =
  process.env.JWT_SECRET || "secretkey";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const [users] = await db.query(
      "SELECT id,name,email,avatar FROM users WHERE id = ?",
      [decoded.id]
    );

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

module.exports = {
  authMiddleware,
  JWT_SECRET,
};