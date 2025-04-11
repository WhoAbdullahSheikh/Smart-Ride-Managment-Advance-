import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "../screens/Sidebar";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeButton, setActiveButton] = useState("Home");
  const location = useLocation();

  // Sync active button with current route
  useEffect(() => {
    const pathToButtonMap = {
      "/dashboard": "Home",
      "/dashboard/profile": "Profile",
      "/dashboard/routes": "Routes",
      "/dashboard/users": "Users",
    };
    
    const currentButton = Object.entries(pathToButtonMap).find(
      ([path]) => location.pathname === path
    )?.[1] || "Home";
    
    setActiveButton(currentButton);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeButton={activeButton}
        setActiveButton={setActiveButton}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: isSidebarOpen ? "240px" : "80px",
          padding: "20px",
          backgroundColor: "#f5f7fa",
          minHeight: "100vh",
          transition: "margin-left 0.3s ease",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;