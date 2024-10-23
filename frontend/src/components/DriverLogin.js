import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Driverlogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("jwtToken")) {
      const decoded = jwtDecode(localStorage.getItem("jwtToken"));
      if (decoded.role === "user") {
        navigate("/");
      } else {
        navigate("/driver");
      }
    }
  }, [navigate]);

  const signIn = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://16.171.237.66:80/driver/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Sign-in failed");
      }

      const data = await response.json();
      const token = data.token;

      localStorage.setItem("jwtToken", token);

      console.log(token);

      navigate("/driver");
    } catch (error) {
      setError("Sign-in failed. Please check your credentials.");
      console.error("Error signing in:", error);
    }
  };

  return (
    <form onSubmit={signIn} className="space-y-6 mt-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <p className="mt-10 font-bold text-xl">
          Welcome to Atlan-Logistics-Company
        </p>
        {error && <p className="text-red-500">{error}</p>}
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
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300"
        >
          Sign In
        </button>
        <p className="text-center text-gray-600 mt-4">
          Don't have an account?{" "}
          <Link to="/driver/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </form>
  );
}

export default Driverlogin;
