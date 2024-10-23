const Booking = require("../models/bookingModel");
const Driver = require("../models/driver");
// const calculatePrice = require("../utils/calculatePrice");

// Create Booking
exports.createBooking = async (req, res) => {
  console.log("Hiii");
  const { pickupLocation, dropoffLocation, vehicleType, estimatedCost } =
    req.body;

  try {
    // const estimatedCost = calculatePrice(
    //   pickupLocation,
    //   dropoffLocation,
    //   vehicleType
    // );

    const booking = new Booking({
      userId: req.user.userId,
      pickupLocation,
      dropoffLocation,
      vehicleType,
      estimatedCost,
    });

    // Matching Algorithm to Assign Driver
    const driver = await findNearestDriver(pickupLocation, vehicleType);

    if (driver) {
      booking.driverId = driver._id;
      booking.status = "Accepted";
      booking.timestamps.acceptedAt = Date.now();
      await booking.save();

      res.json(booking);
    } else {
      res.json({ msg: "No drivers nearby" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

// Find Nearest Driver (Simplified)
const findNearestDriver = async (pickupLocation, vehicleType) => {
  console.log("pickup ", pickupLocation);
  const drivers = await Driver.find({
    availabilityStatus: true,
    "vehicleInfo.vehicleType": vehicleType,
    currentLocation: {
      $near: {
        $geometry: pickupLocation,
        $maxDistance: 5000, // 5 km radius
      },
    },
  }).limit(1);

  return drivers[0];
};

// Update Booking Status
exports.updateBookingStatus = async (req, res) => {
  const { bookingId, status } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });

    booking.status = status;

    // Update timestamps based on status
    if (status === "InProgress") booking.timestamps.pickedUpAt = Date.now();
    if (status === "Completed") booking.timestamps.completedAt = Date.now();

    await booking.save();
    res.json({ msg: "Booking status updated" });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};
