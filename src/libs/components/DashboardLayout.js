import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "../screens/Sidebar";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeButton, setActiveButton] = useState("Home");

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
        <Outlet /> {/* This is where nested routes will render */}
      </Box>
    </Box>
  );
};

export default DashboardLayout;