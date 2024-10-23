const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
  },
  pickupLocation: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  dropoffLocation: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  vehicleType: {
    type: String,
    required: true,
  },
  estimatedCost: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "InProgress", "Completed", "Cancelled"],
    default: "Pending",
  },
  timestamps: {
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: Date,
    pickedUpAt: Date,
    completedAt: Date,
  },
});

module.exports = mongoose.model("Booking", BookingSchema);
