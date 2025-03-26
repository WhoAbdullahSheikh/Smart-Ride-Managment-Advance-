import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignUp from "./libs/screens/SignUp";
import SignIn from "./libs/screens/SignIn";
import DashboardLayout from "./libs/components/DashboardLayout";
import Dashboard from "./libs/screens/Dashboard";
import Profile from "./libs/screens/Profile";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Default route to redirect to signup */}
        <Route path="/" element={<SignUp />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
