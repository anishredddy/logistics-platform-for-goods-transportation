const express = require("express");
const router = express.Router();
const {
  registerUser,
  authUser,
  getUserProfile,
} = require("../controllers/UserController");
const auth = require("../middleware/auth");

// Register User
router.post("/register", registerUser);

// Authenticate User
router.post("/login", authUser);

// Get User Profile
router.get("/profile", auth("user"), getUserProfile);

module.exports = router;
