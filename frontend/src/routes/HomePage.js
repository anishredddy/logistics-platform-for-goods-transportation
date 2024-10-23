// HomePage.js
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Map from "../components/Map";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const socket = io("16.171.237.66:80");

const HomePage = () => {
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupCoordinates, setPickupCoordinates] = useState([
    77.5946, 12.9716,
  ]);
  const [dropoffCoordinates, setDropoffCoordinates] = useState(null);
  const [vehicleType, setVehicleType] = useState("small");
  const [suggestions, setSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [price, setPrice] = useState(null);
  const [driver, setDriver] = useState(null);
  const [a, setA] = useState(false);
  const [booking, setBooking] = useState(false);
  const [msg, setMsg] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("jwtToken")) {
      navigate("/");
    }
  }, [navigate]);

  const vehicleRates = {
    small: { baseFare: 80, perKmRate: 10 },
    medium: { baseFare: 150, perKmRate: 15 },
    large: { baseFare: 500, perKmRate: 25 },
    extraLarge: { baseFare: 800, perKmRate: 35 },
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLongitude = position.coords.longitude;
        const userLatitude = position.coords.latitude;

        setPickupCoordinates([userLongitude, userLatitude]);
        setPickupLocation("Current Location");
      },
      (error) => {
        console.error("Error getting the current location:", error);
      }
    );
  }, []);

  useEffect(() => {
    socket.on("locationUpdate", (data) => {
      console.log("Driver location update:", data);

      console.log(data);
      if (!a) {
        setPickupCoordinates([data.lng, data.lat]);
      } else {
        setDriver([data.lng, data.lat]);
        console.log("hii");
      }
    });

    socket.on("pickedUpOrder", () => {
      setPickupCoordinates(driver);
      setDriver(null);
      setA(false);
      setPickupLocation("Driver's Location");
      console.log("Order picked up, updating map.");
    });

    return () => {
      socket.off("locationUpdate");
      socket.off("pickedUpOrder");
    };
  }, [dropoffCoordinates, driver, a]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    socket.on("CompletedOrder", () => {
      if (!msg) {
        toast.success("Your package has been delivered");
        setMsg(true);
      }

      setA(false);
      setDriver(null);
      setBooking(false);
      setDropoffCoordinates(null);
      setDropoffLocation("");
      socket.disconnect();
    });
  }, [msg]);

  const handleLocationChange = async (e, isPickup) => {
    const value = e.target.value;
    if (isPickup) {
      setPickupLocation(value);
      setActiveInput("pickup");
    } else {
      setDropoffLocation(value);
      setActiveInput("dropoff");
    }

    if (value.length > 2) {
      const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        value
      )}.json?access_token=${accessToken}&autocomplete=true&limit=5`;

      try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (data.features) {
          setSuggestions(data.features);
        }
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion, isPickup) => {
    const [lng, lat] = suggestion.geometry.coordinates;

    if (isPickup) {
      setPickupCoordinates([lng, lat]);
      setPickupLocation(suggestion.place_name);
    } else {
      setDropoffCoordinates([lng, lat]);
      setDropoffLocation(suggestion.place_name);
    }

    setSuggestions([]);
    setActiveInput(null);
  };

  const handleVehicleTypeChange = (e) => {
    setVehicleType(e.target.value);
  };

  const updatePrice = (distance) => {
    const { baseFare, perKmRate } = vehicleRates[vehicleType];
    const cost = baseFare + (distance / 1000) * perKmRate;
    setPrice(cost.toFixed(2));
  };

  const handleBooking = async () => {
    if (!pickupCoordinates || !dropoffCoordinates) {
      toast.error("Please select both pickup and drop-off locations.");
      return;
    }

    const bookingData = {
      pickupLocation: {
        type: "Point",
        coordinates: pickupCoordinates,
      },
      dropoffLocation: {
        type: "Point",
        coordinates: dropoffCoordinates,
      },
      vehicleType,
      estimatedCost: price,
    };

    const token = localStorage.getItem("jwtToken");

    if (!token) {
      toast.error("Authentication token is missing. Please log in again.");
      return;
    }

    try {
      const response = await fetch("http://16.171.237.66:80/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Booking Successfull");
        socket.emit("joinBooking", { bookingId: data._id, role: "user" });
        setBooking(true);
        setA(true);
      } else {
        if (data.msg === "No drivers nearby") {
          toast.error("No drivers nearby");
        } else {
          toast.error("Booking Failed");
        }
      }
    } catch (error) {
      toast.error("Booking Failed");
      console.error("Error making booking request:", error);
    }
  };

  return (
    <div className="flex h-screen">
      <Toaster />
      <div className="w-1/2 bg-gray-100 p-8">
        <h1 className="text-3xl font-bold mb-4">
          Welcome to the Atlan Logistics Application
        </h1>
        {!booking && (
          <>
            <p className="text-lg mb-4">
              Enter your pickup and drop-off locations to view the route on the
              map.
            </p>
            <div className="mb-4 relative">
              <label className="block mb-2 font-semibold">
                Pickup Location
              </label>
              <input
                type="text"
                value={pickupLocation}
                onChange={(e) => handleLocationChange(e, true)}
                placeholder="Enter pickup location"
                className="border p-2 w-full mb-2"
                onFocus={() => setActiveInput("pickup")}
              />
              {suggestions.length > 0 && activeInput === "pickup" && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded w-full mt-1 max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion, true)}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                    >
                      {suggestion.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-4 relative">
              <label className="block mb-2 font-semibold">
                Drop-off Location
              </label>
              <input
                type="text"
                value={dropoffLocation}
                onChange={(e) => handleLocationChange(e, false)}
                placeholder="Enter drop-off location"
                className="border p-2 w-full mb-2"
                onFocus={() => setActiveInput("dropoff")}
              />
              {suggestions.length > 0 && activeInput === "dropoff" && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded w-full mt-1 max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <li
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion, false)}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                    >
                      {suggestion.place_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <label className="block mb-2 font-semibold">Vehicle Type</label>
            <select
              value={vehicleType}
              onChange={handleVehicleTypeChange}
              className="border p-2 w-full mb-2"
            >
              <option value="small">Small Package - 2 Wheeler</option>
              <option value="medium">Medium Sized - Auto</option>
              <option value="large">Large - Mini Truck</option>
              <option value="extraLarge">Extra Large - Truck</option>
            </select>
            {price && (
              <p className="text-xl font-semibold mt-4">
                Estimated Price: ₹{price}
              </p>
            )}
            <button
              onClick={handleBooking}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
            >
              Book Vehicle
            </button>
          </>
        )}
        {booking && (
          <>
            <p className="text-lg mb-4">
              {a
                ? "Your order has been placed, Driver is on his way to pickup"
                : "Your Order is picked up and is being delivered"}
            </p>
            <p className="text-xl font-semibold mt-4">Price: ₹{price}</p>
          </>
        )}
      </div>
      <div className="w-1/2">
        <Map
          pickupCoordinates={pickupCoordinates}
          dropoffCoordinates={dropoffCoordinates}
          updatePrice={updatePrice}
          driverCoordinates={driver}
        />
      </div>
    </div>
  );
};

export default HomePage;
