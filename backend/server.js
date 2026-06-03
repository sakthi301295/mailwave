const express = require("express");
const cors = require("cors");
require("dotenv").config();

const usersRoutes = require("./routes/usersRoutes");
const contactsRoutes = require("./routes/contactsRoutes");
const emailsRoutes = require("./routes/emails");
const draftsRoutes = require("./routes/draftsRoutes");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/emails", emailsRoutes);
app.use("/api/drafts", draftsRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MailWave API Running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});