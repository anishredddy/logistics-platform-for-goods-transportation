const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  vehicleInfo: {
    vehicleType: String,
    capacity: Number,
    licensePlate: String,
  },
  availabilityStatus: {
    type: Boolean,
    default: true,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

DriverSchema.index({ currentLocation: "2dsphere" });

module.exports = mongoose.model("Driver", DriverSchema);
