const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

/**
 * Get all drafts for the current user
 */
exports.getDrafts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [drafts] = await db.query(
      "SELECT * FROM emails WHERE user_id = ? AND folder = 'drafts' ORDER BY updated_at DESC, created_at DESC",
      [userId]
    );

    res.json({ drafts, total: drafts.length });
  } catch (err) {
    console.error("getDrafts error:", err);
    res.status(500).json({ error: "Failed to fetch drafts", details: err.message });
  }
};

/**
 * Create or update a draft
 */
exports.saveDraft = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id, to, cc, bcc, subject, body } = req.body;


    if (id) {
      // Update existing draft
      const [rows] = await db.query(
        "SELECT * FROM emails WHERE id = ? AND user_id = ? AND folder = 'drafts'",
        [id, userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Draft not found" });
      }

      await db.query(
        `UPDATE emails SET to_address = ?, cc = ?, bcc = ?, subject = ?, body = ?, body_plain = ?, updated_at = ?
         WHERE id = ?`,
        [to, cc || null, bcc || null, subject, body, body.replace(/<[^>]*>/g, ""), new Date(), id]
      );

      res.json({ success: true, id });
    } else {
      // Create new draft
      const draftId = uuidv4();
      const now = new Date();

      const bodyPlain = body ? body.replace(/<[^>]*>/g, "") : "";

      await db.query(
        `INSERT INTO emails
         (id, user_id, message_id, from_address, from_name, to_address, cc, bcc, subject, body, body_plain, folder, is_read, is_starred, is_important, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'drafts', 1, 0, 0, ?, ?)`,
        [
          draftId,
          userId,
          `draft-${draftId}`,
          req.user.email,
          req.user.name,
          to,
          cc || null,
          bcc || null,
          subject,
          body,
          bodyPlain,
          now,
          now
        ]
      );

      res.status(201).json({
        success: true,
        draft: {
          id: draftId,
          to,
          subject,
          body
        }
      });
    }
  } catch (err) {
    console.error("saveDraft error:", err);
    res.status(500).json({ error: "Failed to save draft", details: err.message });
  }
};

/**
 * Get a single draft
 */
exports.getDraftById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM emails WHERE id = ? AND user_id = ? AND folder = 'drafts'",
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Draft not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getDraftById error:", err);
    res.status(500).json({ error: "Failed to fetch draft", details: err.message });
  }
};

/**
 * Delete a draft
 */
exports.deleteDraft = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM emails WHERE id = ? AND user_id = ? AND folder = 'drafts'",
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Draft not found" });
    }

    await db.query("DELETE FROM emails WHERE id = ?", [id]);

    res.json({ success: true, message: "Draft deleted" });
  } catch (err) {
    console.error("deleteDraft error:", err);
    res.status(500).json({ error: "Failed to delete draft", details: err.message });
  }
};