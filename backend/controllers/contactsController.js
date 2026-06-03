const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

/**
 * Get all contacts for the current user
 */
exports.getContacts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [contacts] = await db.query(
      "SELECT * FROM contacts WHERE user_id = ? ORDER BY name ASC",
      [userId]
    );

    res.json({ contacts, total: contacts.length });
  } catch (err) {
    console.error("getContacts error:", err);
    res.status(500).json({ error: "Failed to fetch contacts", details: err.message });
  }
};

/**
 * Create a new contact
 */
exports.createContact = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, email, phone, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const [existing] = await db.query(
      `
      SELECT id
      FROM contacts
      WHERE user_id = ?
      AND email = ?
      `,
      [userId, email]
    );

    if (existing.length) {
      return res.status(409).json({
        error: "Contact already exists",
      });
    }

    const contactId = uuidv4();
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    await db.query(
      `INSERT INTO contacts (id, user_id, name, email, phone, notes, avatar, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [contactId, userId, name, email, phone || null, notes || null, initials, new Date()]
    );

    res.status(201).json({ success: true, id: contactId });
  } catch (err) {
    console.error("createContact error:", err);
    res.status(500).json({ error: "Failed to create contact", details: err.message });
  }
};

/**
 * Get a single contact
 */
exports.getContactById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM contacts WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("getContactById error:", err);
    res.status(500).json({ error: "Failed to fetch contact", details: err.message });
  }
};

/**
 * Update a contact
 */
exports.updateContact = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, email, phone, notes } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM contacts WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push("name = ?");
      params.push(name);
    }
    if (email) {
      updates.push("email = ?");
      params.push(email);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      params.push(phone || null);
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      params.push(notes || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(id);
    params.push(userId);

    const query = `
UPDATE contacts
SET ${updates.join(", ")}
WHERE id = ? AND user_id = ?
`;
    await db.query(query, params);

    res.json({ success: true, message: "Contact updated" });
  } catch (err) {
    console.error("updateContact error:", err);
    res.status(500).json({ error: "Failed to update contact", details: err.message });
  }
};

/**
 * Delete a contact
 */
exports.deleteContact = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM contacts WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    await db.query(
      "DELETE FROM contacts WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    res.json({ success: true, message: "Contact deleted" });
  } catch (err) {
    console.error("deleteContact error:", err);
    res.status(500).json({ error: "Failed to delete contact", details: err.message });
  }
};
