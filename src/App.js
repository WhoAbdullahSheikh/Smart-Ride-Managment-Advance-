import React from "react";
import { Box } from "@mui/material";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignUp from "./user/screens/SignUp";
import SignIn from "./user/screens/SignIn";
import AdminSignIn from "./libs/screens/adminSignIn";
import DashboardLayout from "./libs/components/DashboardLayout";
import UserDashboardLayout from "./user/components/UserDashboardLayout";
import Dashboard from "./libs/screens/Dashboard";
import Profile from "./libs/screens/Profile";
import CreateRoutes from "./libs/screens/CreateRoutes";
import Users from "./libs/screens/Users";
import Drivers from "./libs/screens/Drivers";
import ManageRoutes from "./libs/screens/ManageRoutes"
import UserDashboard from "./user/screens/UserDashboard";
import UserProfile from "./user/screens/UserProfile";
import ViewRoutes from "./user/screens/ViewRoutes";

import { AnimatePresence } from "framer-motion";
const App = () => {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          
          <Route path="/" element={<SignUp />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/adminsignin" element={<AdminSignIn />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="createroutes" element={<CreateRoutes />} />
            <Route path="profile" element={<Profile />} />
            <Route path="users" element={<Users />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="manageroutes" element={<ManageRoutes />} />
          </Route>
          <Route path="/userdashboard" element={<UserDashboardLayout />}>
            <Route index element={<UserDashboard />} />
            <Route path="userprofile" element={<UserProfile />} />
            <Route path="viewroutes" element={<ViewRoutes />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Router>
  );
};

export default App;
