const Driver = require("../models/driver");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register Driver
exports.registerDriver = async (req, res) => {
  const { name, email, password, vehicleInfo } = req.body;

  try {
    let driver = await Driver.findOne({ email });
    if (driver) return res.status(400).json({ msg: "Driver already exists" });

    driver = new Driver({ name, email, password, vehicleInfo });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    driver.password = await bcrypt.hash(password, salt);

    await driver.save();

    // Return JWT
    const payload = { userId: driver.id, role: "driver" };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

// Authenticate Driver
exports.authDriver = async (req, res) => {
  const { email, password } = req.body;

  try {
    let driver = await Driver.findOne({ email });
    if (!driver) return res.status(400).json({ msg: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    // Return JWT
    const payload = { userId: driver.id, role: "driver" };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

// Update Driver Availability and Location
exports.updateDriverStatus = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.userId);
    if (!driver) return res.status(404).json({ msg: "Driver not found" });

    const { availabilityStatus, currentLocation } = req.body;

    if (availabilityStatus !== undefined)
      driver.availabilityStatus = availabilityStatus;
    if (currentLocation) driver.currentLocation = currentLocation;

    await driver.save();
    console.log(currentLocation);
    res.json({ msg: "Driver status updated" });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};
