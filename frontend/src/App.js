import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar";
import SignInForm from "./components/SignInForm";
import SignUpForm from "./components/SignupForm";
import HomePage from "./routes/HomePage";
import Driverlogin from "./components/DriverLogin";
import DriverPage from "./routes/DriverPage";
import DriverSignUpForm from "./components/DriverSignup";

function App() {
  return (
    <div className="h-screen">
      <Router>
        <NavBar />
        {/* <div className="flex items-center justify-center h-full">
          <p className="text-3xl">welcome to Atlan</p>
        </div> */}
        <Routes>
          <Route path="/" element={<SignInForm />} />
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/driver/signin" element={<Driverlogin />} />
          <Route path="/driver/signup" element={<DriverSignUpForm />} />
          <Route path="/driver" element={<DriverPage />} />
        </Routes>
      </Router>
    </div>
  );
}
export default App;
