const db = require("../config/db");

// GET all users
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT
        id,
        name,
        email,
        avatar,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(users);

  } catch (error) {
    console.error("GET USERS ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// GET single user
exports.getUserById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        id,
        name,
        email,
        avatar,
        created_at
      FROM users
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("GET USER ERROR:", error);

    res.status(500).json({
      error: error.message,
    });
  }
};