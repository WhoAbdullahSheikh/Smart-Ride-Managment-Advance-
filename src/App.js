import React from "react";
import { Box } from "@mui/material";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignUp from "./libs/screens/SignUp";
import SignIn from "./libs/screens/SignIn";
import DashboardLayout from "./libs/components/DashboardLayout";
import Dashboard from "./libs/screens/Dashboard";
import Profile from "./libs/screens/Profile";
import { AnimatePresence } from "framer-motion";
const App = () => {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          {}
          <Route path="/" element={<SignUp />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Router>
  );
};

export default App;
