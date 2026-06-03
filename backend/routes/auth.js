const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const db = require("../config/db");

const {
  authMiddleware,
  JWT_SECRET,
} = require("../middleware/auth");

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    // Check existing email
    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Create UUID
    const userId = uuidv4();

    // Insert User
    await db.query(
      `INSERT INTO users
      (id, name, email, password, avatar, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        email,
        hashedPassword,
        initials,
        new Date(),
      ]
    );

    // Welcome Email
    const welcomeBody = `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#89b4fa">
          Welcome to MailWave, ${name}!
        </h2>

        <p>We're thrilled to have you.</p>

        <p>Get started by composing your first email!</p>

        <p>— The MailWave Team</p>
      </div>
    `;

    const emailId = uuidv4();

    await db.query(
      `INSERT INTO emails
      (
        id,
        user_id,
        message_id,
        from_address,
        from_name,
        to_address,
        subject,
        body,
        body_plain,
        folder,
        is_read,
        is_starred,
        is_important,
        sent_at,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emailId,
        userId,
        `welcome-${userId}`,
        "welcome@mailwave.app",
        "MailWave Team",
        email,
        "👋 Welcome to MailWave!",
        welcomeBody,
        `Welcome to MailWave, ${name}!`,
        "inbox",
        false,
        false,
        false,
        new Date(),
        new Date(),
      ]
    );

    // JWT Token
    const token = jwt.sign(
      {
        id: userId,
        name,
        email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        avatar: initials,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
    });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// ================= TEST =================
router.get("/test", (req, res) => {
  res.json({
    message: "Auth route working",
  });
});

// ================= CURRENT USER =================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE id = ?",
      [req.user.id]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const { password, ...safeUser } = user;

    res.json(safeUser);
  } catch (error) {
    console.error("ME ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

router.get("/verify", authMiddleware, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});


router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    await db.query(
      `UPDATE users
       SET name = ?
       WHERE id = ?`,
      [name, req.user.id]
    );

    res.json({
      success: true,
      message: "Profile updated",
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;