const db = require("../config/db");

/**
 * Get emails with folder, search, and pagination support
 * Query params:
 *   - folder: 'inbox' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash' | 'starred' | 'important'
 *   - search: search query for subject, from, to, or body
 *   - page: page number (default 1)
 *   - limit: items per page (default 50)
 */
exports.getEmails = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { folder = 'inbox', search = '', page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM emails WHERE user_id = ?';
    const params = [userId];

    // Handle special folders
    if (folder === 'starred') {
      query += ' AND is_starred = 1';
    } else if (folder === 'important') {
      query += ' AND is_important = 1';
    } else {
      query += ' AND folder = ?';
      params.push(folder);
    }

    // Add search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (subject LIKE ? OR from_address LIKE ? OR to_address LIKE ? OR body LIKE ?)`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get paginated results
    query += ' ORDER BY sent_at DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    res.json({
      emails: rows,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('getEmails error:', err);
    res.status(500).json({ error: 'Failed to fetch emails', details: err.message });
  }
};

/**
 * Get unread email counts per folder
 */
exports.getEmailCounts = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const folders = ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'];
    const counts = {};

    for (const folder of folders) {
      const [result] = await db.query(
        `SELECT COUNT(*) as count FROM emails WHERE user_id = ? AND folder = ? AND is_read = 0`,
        [userId, folder]
      );
      counts[folder] = result[0]?.count || 0;
    }

    // Add starred and important counts
    const [starredResult] = await db.query(
      `SELECT COUNT(*) as count FROM emails WHERE user_id = ? AND is_starred = 1`,
      [userId]
    );
    counts.starred = starredResult[0]?.count || 0;

    const [importantResult] = await db.query(
      `SELECT COUNT(*) as count FROM emails WHERE user_id = ? AND is_important = 1`,
      [userId]
    );
    counts.important = importantResult[0]?.count || 0;

    res.json(counts);
  } catch (err) {
    console.error('getEmailCounts error:', err);
    res.status(500).json({ error: 'Failed to fetch counts', details: err.message });
  }
};

/**
 * Get a single email by ID
 */
exports.getEmailById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM emails WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const email = rows[0];

    // Mark as read
    if (!email.is_read) {
      await db.query('UPDATE emails SET is_read = 1 WHERE id = ?', [id]);
    }

    res.json(email);
  } catch (err) {
    console.error('getEmailById error:', err);
    res.status(500).json({ error: 'Failed to fetch email', details: err.message });
  }
};

/**
 * Update email (star, mark important, move folder, etc.)
 */
exports.updateEmail = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { is_starred, is_important, folder, is_read } = req.body;

    // Verify ownership
    const [rows] = await db.query(
      'SELECT * FROM emails WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    let updateQuery = 'UPDATE emails SET';
    const updateParams = [];
    const updates = [];

    if (is_starred !== undefined) {
      updates.push('is_starred = ?');
      updateParams.push(is_starred ? 1 : 0);
    }
    if (is_important !== undefined) {
      updates.push('is_important = ?');
      updateParams.push(is_important ? 1 : 0);
    }
    if (folder) {
      updates.push('folder = ?');
      updateParams.push(folder);
    }
    if (is_read !== undefined) {
      updates.push('is_read = ?');
      updateParams.push(is_read ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateQuery += ' ' + updates.join(', ') + ' WHERE id = ?';
    updateParams.push(id);

    await db.query(updateQuery, updateParams);

    res.json({ success: true, message: 'Email updated' });
  } catch (err) {
    console.error('updateEmail error:', err);
    res.status(500).json({ error: 'Failed to update email', details: err.message });
  }
};

/**
 * Delete email permanently
 */
exports.deleteEmail = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM emails WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    await db.query('DELETE FROM emails WHERE id = ?', [id]);

    res.json({ success: true, message: 'Email deleted' });
  } catch (err) {
    console.error('deleteEmail error:', err);
    res.status(500).json({ error: 'Failed to delete email', details: err.message });
  }
};