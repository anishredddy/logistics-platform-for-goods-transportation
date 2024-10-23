import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

function DriverSignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState("small");
  const [capacity, setCapacity] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === "user") {
          navigate("/");
        } else {
          navigate("/driver");
        }
      } catch (error) {
        console.error("Failed to decode JWT:", error);
        localStorage.removeItem("jwtToken");
      }
    }
  }, [navigate]);

  const signUp = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://16.171.237.66:80/driver/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          vehicleInfo: {
            vehicleType,
            capacity: parseInt(capacity, 10),
            licensePlate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Sign-up failed");
      }

      const data = await response.json();
      const token = data.token;

      localStorage.setItem("jwtToken", token);

      toast.success("Sign-up successful:");

      navigate("/driver");
    } catch (error) {
      setError("Sign-up failed. Please check your details.");
      toast.error("Error signing up:");
    }
  };

  return (
    <form onSubmit={signUp} className="space-y-6 mt-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <p className="mt-10 font-bold text-xl">
          Welcome to Atlan-Logistics-Company - Driver Sign Up
        </p>
        {error && <p className="text-red-500">{error}</p>}
        <div>
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-gray-700">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </div>
        <div>
          <label className="block text-gray-700">Vehicle Type</label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="small">Small - 2 Wheeler</option>
            <option value="medium">Medium - Auto</option>
            <option value="large">Large - Mini Truck</option>
            <option value="extraLarge">Extra Large - Truck</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700">Vehicle Capacity</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
            className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the capacity"
          />
        </div>
        <div>
          <label className="block text-gray-700">License Plate</label>
          <input
            type="text"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            required
            className="mt-1 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter license plate"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300"
        >
          Sign Up
        </button>
        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/driver-login" className="text-blue-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
}

export default DriverSignUpForm;
