const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db"); // ← add this line

const usersRoutes = require("./routes/usersRoutes");
const contactsRoutes = require("./routes/contactsRoutes");
const emailsRoutes = require("./routes/emails");
const draftsRoutes = require("./routes/draftsRoutes");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://mailwave-blush.vercel.app"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/emails", emailsRoutes);
app.use("/api/drafts", draftsRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({ success: true, message: "MailWave API Running" });
});

const PORT = process.env.PORT || 5000;

// ✅ Wait for DB then start server
const waitForDB = async () => {
  let retries = 10;
  while (retries) {
    try {
      await db.query('SELECT 1');
      console.log('✅ Database connected!');
      return true;
    } catch (err) {
      retries--;
      console.log(`⏳ Waiting for DB... retries left: ${retries}`);
      await new Promise(res => setTimeout(res, 3000));
    }
  }
  throw new Error('❌ Could not connect to database after 10 retries');
};

waitForDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });