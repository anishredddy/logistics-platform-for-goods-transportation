const express = require("express");
const router = express.Router();
const {
  registerDriver,
  authDriver,
  updateDriverStatus,
} = require("../controllers/DriverController");
const auth = require("../middleware/auth");

// Register Driver
router.post("/register", registerDriver);

// Authenticate Driver
router.post("/login", authDriver);

// Update Driver Status
router.put("/status", auth("driver"), updateDriverStatus);

module.exports = router;
