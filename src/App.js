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
import CreateDriver from "./libs/screens/CreateDriver.js";
import VehicleRegistration from "./libs/screens/VehicleRegistration";
import ManageVehicles from "./libs/screens/ManageVehicles.js";
import RideAssign from "./libs/screens/RideAssign";
import Users from "./libs/screens/ManageUsers.js";
import Drivers from "./libs/screens/ManageDrivers.js";
import ManageRoutes from "./libs/screens/ManageRoutes"
import UserDashboard from "./user/screens/UserDashboard";
import UserProfile from "./user/screens/UserProfile";
import ViewRoutes from "./user/screens/ViewRoutes";
import BookingHistory from "./user/screens/BookingHistory";
import DriverDashboardLayout from "./driver/components/DriverDashboardLayout";
import DriverDashboard from "./driver/screens/DriverDashboard";
import DriverProfile from "./driver/screens/DriverProfile";
import RouteDetails from "./driver/screens/RouteDetails";
import PaymentScreen from "./user/screens/PaymentScreen";
import DriverSignIn from "./driver/screens/DriverSignIn";
import AdminFeedbackAndComplaints from "./libs/screens/AdminFeedbackAndComplaints";
import FeedbackAndComplaints from "./user/screens/FeedbackAndComplaints.js";
import PaymentSettings from "./libs/screens/PaymentSettings";
import AdminAnnouncements from "./libs/screens/AdminAnnouncements";
import DriverAnnouncements from "./driver/screens/DriverAnnouncements";
import { AnimatePresence } from "framer-motion";
const App = () => {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          
          <Route path="/" element={<SignUp />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/driversignin" element={<DriverSignIn />} />
          <Route path="/adminsignin" element={<AdminSignIn />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="createroutes" element={<CreateRoutes />} />
            <Route path="profile" element={<Profile />} />
            <Route path="users" element={<Users />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="manageroutes" element={<ManageRoutes />} />
            <Route path="rideassign" element={<RideAssign />} />
            <Route path="createdriver" element={<CreateDriver />} />
            <Route path="vehicleregistration" element={<VehicleRegistration />} />
            <Route path="managevehicles" element={<ManageVehicles />} />
            <Route path="feedbackandcomplaints" element={<AdminFeedbackAndComplaints />} />
            <Route path="paymentsettings" element={<PaymentSettings />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
          </Route>
          <Route path="/userdashboard" element={<UserDashboardLayout />}>
            <Route index element={<UserDashboard />} />
            <Route path="userprofile" element={<UserProfile />} />
            <Route path="viewroutes" element={<ViewRoutes />} />
            <Route path="bookinghistory" element={<BookingHistory />} />
            <Route path="payment" element={<PaymentScreen />} />
            <Route path="feedbackandcomplaints" element={<FeedbackAndComplaints />} />
          </Route>
          <Route path="/driverdashboard" element={<DriverDashboardLayout />}>
            <Route index element={<DriverDashboard />} />
            <Route path="driverprofile" element={<DriverProfile />} />
            <Route path="routedetails" element={<RouteDetails />} />
            <Route path="announcements" element={<DriverAnnouncements />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Router>
  );
};

export default App;
