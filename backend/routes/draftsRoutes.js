const express = require("express");
const router = express.Router();
const draftsController = require("../controllers/draftsController");
const { authMiddleware } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET all drafts
router.get("/", draftsController.getDrafts);

// POST save a draft (create or update)
router.post("/", draftsController.saveDraft);

// GET single draft by ID
router.get("/:id", draftsController.getDraftById);

// DELETE draft
router.delete("/:id", draftsController.deleteDraft);

module.exports = router;