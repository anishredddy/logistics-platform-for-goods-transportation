require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");
const Driver = require("./models/driver");
const Booking = require("./models/bookingModel");
//express app
const app = express();

//http server for websocket
const server = http.createServer(app);

//intialising web socket server
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

const updateDriverStatus = async (userId, body) => {
  try {
    const driver = await Driver.findById(userId);
    if (!driver) {
      console.log("no driver");
      return;
    }

    // console.log(driver);

    const { availabilityStatus, currentLocation } = body;

    // console.log("currrent location ", currentLocation);

    if (availabilityStatus !== undefined)
      driver.availabilityStatus = availabilityStatus;
    if (currentLocation) {
      const { lat, lng } = currentLocation;

      // console.log("lat and lng ", lat, "     ", "lng", lng);
      driver.currentLocation = {
        type: "Point",
        coordinates: [lng, lat],
      };
    }

    await driver.save();
    return { success: true };
  } catch (err) {
    console.log(err);
  }
};

const activeBookings = {};

const activeDrivers = {};

function assignDriverToBooking(
  bookingId,
  driverId,
  pickupLocation,
  dropoffLocation,
  estimatedCost
) {
  // console.log("function invoked");
  const driverSocketId = activeDrivers[driverId];
  // console.log("driver ", driverSocketId);
  if (driverSocketId) {
    // console.log(driverSocketId);
    // activeBookings[bookingId]["driver"] = driverId;
    io.to(driverSocketId).emit("newBooking", {
      bookingId,
      message: "You have been assigned to a new trip!",
      pickupLocation,
      dropoffLocation,
      estimatedCost,
    });
  }
}

io.on("connection", (socket) => {
  console.log("New client connected: ", socket.id);

  socket.on("joinBooking", ({ bookingId, role }) => {
    socket.join(bookingId);

    if (!activeBookings[bookingId]) {
      activeBookings[bookingId] = {
        driver: null,
        user: null,
      };
      activeBookings[bookingId][role] = socket.id;
      console.log(`User ${role} joined booking ${bookingId}: ${socket.id}`);
    }
    activeBookings[bookingId][role] = socket.id;
    console.log("already exist in mem");
  });

  // socket.on("DrivertoUserLocationUpdate", ({ bookingId, location }) => {
  //   console.log(location);
  //   socket.to(bookingId).emit("locationUpdate", location);
  // });

  socket.on("CompletedOrder", async (bookingId) => {
    socket.to(bookingId).emit("CompletedOrder");

    delete activeBookings[bookingId];
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on("Pickeduporder", (bookingId) => {
    socket.to(bookingId).emit("pickedUpOrder");
  });

  socket.on("DriverLocationUpdate", async (data) => {
    const { token, location, bookingId } = data;

    // console.log("location update");
    // console.log(location);

    try {
      if (!token) {
        console.log("no token");
        socket.emit("no token");
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userId = decoded.userId;

      if (!activeDrivers[userId] || activeDrivers[userId] !== socket.id) {
        activeDrivers[userId] = socket.id;
      }
      // console.log("acitve drivers ", activeDrivers[userId]);

      // console.log(userId);

      const response = await updateDriverStatus(userId, {
        currentLocation: location,
      });

      if (response && bookingId) {
        socket.to(bookingId).emit("locationUpdate", location);
      }

      // console.log(response);

      if (response) {
        socket.emit("StatusUpdateResponse", response);
      } else {
        socket.emit("StatusUpdateError", { msg: "Driver not found." });
      }
    } catch (error) {
      console.error("Error updating driver status:", error.message);
      socket.emit("StatusUpdateError", { msg: error.message });
    }
  });
});
const findNearestDriver = async (pickupLocation, vehicleType) => {
  // console.log("pickup ", pickupLocation);
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

//create booking
const createBooking = async (req, res) => {
  // console.log("Hiiigfhdh");
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

      await assignDriverToBooking(
        booking._id,
        driver._id,
        pickupLocation,
        dropoffLocation,
        estimatedCost
      ),
        res.json(booking);
    } else {
      res.status(400).json({ msg: "No drivers nearby" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

//db
connectDB();

//middleware
app.use(cors());
app.use(express.json());

//routes
app.use("/users", require("./routes/UserRoutes"));
app.use("/driver", require("./routes/DriverRoutes"));
app.use("/booking", require("./routes/BookingRoutes"));

app.post("/bookings/", auth("user"), createBooking);

app.use(require("./middleware/errorHandler"));

const PORT = process.env.PORT || 5000; // or any other port
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
