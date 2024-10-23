const express = require("express");
const router = express.Router();
const {
  createBooking,
  updateBookingStatus,
} = require("../controllers/BookingController");
const auth = require("../middleware/auth");

// Create Booking
router.post("/", auth("user"), createBooking);

// Update Booking Status
router.put("/status", auth(["user", "driver"]), updateBookingStatus);

module.exports = router;
