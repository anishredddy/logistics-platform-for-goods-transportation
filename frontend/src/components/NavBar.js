import React from "react";
import { Link, useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("jwtToken"); // Check if the token is present

  const handleSignOut = () => {
    localStorage.removeItem("jwtToken"); // Remove the token from local storage
    navigate("/"); // Redirect to the home page
  };

  return (
    <div className="border-b">
      <div className="mx-auto max-w-7xl">
        <div className="relative px-4 sm:px-6 lg:px-8 flex h-16 items-center">
          <p className="font-bold text-xl">Atlan</p>
          <Link to="/driver/signin">
            <div className="ml-12 font-normal text-lg">Driver?</div>
          </Link>
          <div className="mx-6 ml-auto flex items-center space-x-4 lg:space-x-6 text-lg">
            <Link to="/home">
              <p className="underline cursor-pointer">Book an Order</p>
            </Link>
            {isLoggedIn ? (
              <button
                onClick={handleSignOut}
                className="text-red-500 hover:text-red-700 transition duration-300"
              >
                Sign Out
              </button>
            ) : (
              <Link to="/" className="text-blue-500 hover:underline">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NavBar;
