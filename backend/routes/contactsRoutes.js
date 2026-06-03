const express = require("express");
const router = express.Router();
const contactsController = require("../controllers/contactsController");
const { authMiddleware } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET all contacts
router.get("/", contactsController.getContacts);

// POST create a new contact
router.post("/", contactsController.createContact);

// GET single contact by ID
router.get("/:id", contactsController.getContactById);

// PATCH update a contact
router.patch("/:id", contactsController.updateContact);

// DELETE a contact
router.delete("/:id", contactsController.deleteContact);

module.exports = router;