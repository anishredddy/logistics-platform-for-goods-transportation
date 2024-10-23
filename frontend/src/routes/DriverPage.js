// DriverPage.js
import React, { useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import io from "socket.io-client";
import DriverMap from "../components/DriverMap";
import { useNavigate } from "react-router-dom";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
let socket;

const DriverPage = () => {
  const [driverLocation, setDriverLocation] = useState([77.5946, 12.9716]);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setdropLocation] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [status, setStatus] = useState(null);
  const token = localStorage.getItem("jwtToken");
  const [cost, setCost] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const Tok = localStorage.getItem("jwtToken");
    if (!Tok) {
      navigate("/driver/signin");
    }
  }, [navigate]);

  const initializeSocketConnection = () => {
    if (!socket) {
      socket = io("16.171.237.66:80", {
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      socket.on("connect", () => {
        console.log("Connected to the server:", socket.id);
      });

      socket.on("connect_error", (err) => {
        console.error("Connection error:", err);
      });

      socket.on("newBooking", (data) => {
        console.log("New booking received:", data);
        const { bookingId, pickupLocation, dropoffLocation, estimatedCost } =
          data;

        setCost(estimatedCost);

        setPickupLocation([
          pickupLocation.coordinates[0],
          pickupLocation.coordinates[1],
        ]);

        setdropLocation([
          dropoffLocation.coordinates[0],
          dropoffLocation.coordinates[1],
        ]);

        console.log(dropoffLocation);

        setBookingId(bookingId);

        setStatus("Pickup");
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from the server.");
      });

      socket.on("StatusUpdateResponse", (response) => {
        console.log("Status update response:", response);
      });

      socket.on("StatusUpdateError", (error) => {
        console.error("Status update error:", error);
      });
    }
  };

  const getCurrentLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = [position.coords.longitude, position.coords.latitude];
        setDriverLocation(location);

        if (token && socket && socket.connected) {
          socket.emit("DriverLocationUpdate", {
            token,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            bookingId,
          });
        }

        console.log("Initial location set:", location);
      },
      (error) => {
        console.error("Error getting the current location:", error);
      }
    );
  }, [token, bookingId]);

  const sendDriverLocation = useCallback(() => {
    if (!token || !socket || !socket.connected) {
      console.error(
        "Socket is not connected or token is missing. Please log in."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDriverLocation([
          position.coords.longitude,
          position.coords.latitude,
        ]);

        if (token && location) {
          socket.emit("DriverLocationUpdate", {
            token,
            location: location,
            bookingId,
          });
        }

        console.log("Location sent:", location);
      },
      (error) => {
        console.error("Error getting the current location:", error);
      }
    );
  }, [token, bookingId]);

  useEffect(() => {
    initializeSocketConnection();

    getCurrentLocation();

    const interval = setInterval(sendDriverLocation, 20 * 1000);
    sendDriverLocation();

    return () => clearInterval(interval);
  }, [sendDriverLocation, getCurrentLocation]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("connect_error");
        socket.off("disconnect");
        socket.off("newBooking");
        socket.off("StatusUpdateResponse");
        socket.off("StatusUpdateError");
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  const clickButton = () => {
    if (status === "Pickup") {
      setStatus("Dropoff");
      setPickupLocation(dropLocation);
      socket.emit("Pickeduporder", bookingId);
    } else {
      console.log("completed");
      setStatus("Completed");
      socket.emit("CompletedOrder", bookingId);
      setPickupLocation(null);
      setStatus(null);
    }
  };

  return (
    <div className="flex h-screen">
      {!status && (
        <div className="w-1/2 bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-4">Driver Dashboard</h1>
          <p className="text-lg mb-4">
            Your current location is being updated every 10 seconds.
          </p>
        </div>
      )}
      {status && (
        <div className="w-1/2 bg-gray-100 p-8">
          <h1 className="text-3xl font-bold mb-4">
            Your earning's for this trip : {cost}
          </h1>
          <h1 className="text-3xl font-bold mb-4">
            {status === "Pickup"
              ? "Please go pickup Order"
              : "Please deliver order"}
          </h1>
          <button
            className="text-lg mb-4 cursor-pointer bg-black text-white rounded-lg px-4 py-3"
            onClick={clickButton}
          >
            {status === "Pickup"
              ? "Mark as Picked-up?"
              : "Mark Order as Completed"}
          </button>
        </div>
      )}
      <div className="w-1/2">
        <DriverMap
          pickupCoordinates={pickupLocation}
          dropoffCoordinates={driverLocation}
        />
      </div>
    </div>
  );
};

export default DriverPage;
