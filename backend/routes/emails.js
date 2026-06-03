const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

// ================= GET EMAILS =================
router.get("/", async (req, res) => {
  try {
    const { folder = "inbox", search = "", page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const userId = req.user.id;

    let query = `SELECT * FROM emails WHERE user_id = ?`;
    const params = [userId];

    // Handle special folders
    if (folder === "starred") {
      query += ` AND is_starred = 1`;
    } else if (folder === "important") {
      query += ` AND is_important = 1`;
    } else {
      query += ` AND folder = ?`;
      params.push(folder);
    }

    // Add search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (subject LIKE ? OR from_address LIKE ? OR to_address LIKE ? OR body LIKE ? OR body_plain LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get paginated results
    const paginatedQuery = query + ` ORDER BY sent_at DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const [emails] = await db.query(paginatedQuery, params);

    res.json({
      emails,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("GET EMAILS ERROR:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

// ================= COUNTS =================
router.get("/counts", async (req, res) => {
  try {
    const userId = req.user.id;
    const folders = ["inbox", "sent", "drafts", "trash", "spam", "archive"];
    const counts = {};

    // Get unread counts per folder
    for (const folder of folders) {
      const [result] = await db.query(
        `SELECT COUNT(*) as count FROM emails 
         WHERE user_id = ? AND folder = ? AND is_read = 0`,
        [userId, folder]
      );
      counts[folder] = result[0]?.count || 0;
    }

    // Get starred count
    const [starredResult] = await db.query(
      `SELECT COUNT(*) as count FROM emails 
       WHERE user_id = ? AND is_starred = 1`,
      [userId]
    );
    counts.starred = starredResult[0]?.count || 0;

    // Get important count
    const [importantResult] = await db.query(
      `SELECT COUNT(*) as count FROM emails 
       WHERE user_id = ? AND is_important = 1`,
      [userId]
    );
    counts.important = importantResult[0]?.count || 0;

    res.json(counts);
  } catch (error) {
    console.error("COUNTS ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// ================= SINGLE EMAIL =================
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM emails
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Email not found",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("EMAIL ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// ================= SEND EMAIL =================
router.post("/send", async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    const emailId = uuidv4();

    await db.query(
      `
      INSERT INTO emails
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
      VALUES
      (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        emailId,
        req.user.id,
        `msg-${emailId}`,
        req.user.email,
        req.user.name,
        to,
        subject,
        body,
        body.replace(/<[^>]*>/g, ""),
        "sent",
        1,
        0,
        0,
        new Date(),
        new Date(),
      ]
    );

    res.status(201).json({
      success: true,
      smtpSent: false,
      message: "Email saved in Sent folder",
      id: emailId

    });
  } catch (error) {
    console.error("SEND ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

// ================= UPDATE EMAIL =================
router.patch("/:id", async (req, res) => {
  try {
    const { is_starred, is_important, folder, is_read } = req.body;
    const emailId = req.params.id;
    const userId = req.user.id;

    // Verify ownership
    const [rows] = await db.query(
      `SELECT * FROM emails WHERE id = ? AND user_id = ?`,
      [emailId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Email not found",
      });
    }

    const updates = [];
    const params = [];

    if (is_starred !== undefined) {
      updates.push("is_starred = ?");
      params.push(is_starred ? 1 : 0);
    }
    if (is_important !== undefined) {
      updates.push("is_important = ?");
      params.push(is_important ? 1 : 0);
    }
    if (folder) {
      updates.push("folder = ?");
      params.push(folder);
    }
    if (is_read !== undefined) {
      updates.push("is_read = ?");
      params.push(is_read ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: "No fields to update",
      });
    }

    params.push(emailId);
    const query = `UPDATE emails SET ${updates.join(", ")} WHERE id = ?`;

    await db.query(query, params);

    res.json({
      success: true,
      message: "Email updated",
    });
  } catch (error) {
    console.error("UPDATE EMAIL ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});


router.post("/draft", async (req, res) => {

  try {

    const {
      to,
      cc,
      bcc,
      subject,
      body
    } = req.body;

    const draftId = uuidv4();

    await db.query(
      `
      INSERT INTO emails (
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
        created_at
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        draftId,
        req.user.id,
        `draft-${draftId}`,
        req.user.email,
        req.user.name,
        to,
        subject,
        body,
        body.replace(/<[^>]*>/g, ""),
        "drafts",
        new Date()
      ]
    );

    res.status(201).json({
      success: true,
      id: draftId
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


router.post("/test-smtp", async (req, res) => {

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return res.status(400).json({
      error: "SMTP not configured"
    });
  }

  res.json({
    success: true,
    message: "SMTP ready"
  });

});

// ================= DELETE EMAIL =================
router.delete("/:id", async (req, res) => {
  try {
    await db.query(
      `DELETE FROM emails
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;