const express = require("express");
const router = express.Router();

const usersController = require("../controllers/usersController");
const { authMiddleware } = require("../middleware/auth");

// Protected routes
router.use(authMiddleware);

router.get("/", usersController.getUsers);
router.get("/:id", usersController.getUserById);

module.exports = router;