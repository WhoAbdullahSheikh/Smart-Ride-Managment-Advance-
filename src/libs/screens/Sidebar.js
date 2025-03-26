import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { FaBars, FaHome, FaUser, FaSignOutAlt } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";  // Import auth from your Firebase setup

const Sidebar = ({ isOpen, toggleSidebar, activeButton, setActiveButton }) => {
  const navigate = useNavigate(); // Hook to navigate to other routes

  const sidebarButtons = [
    { name: "Home", icon: <FaHome />, path: "/dashboard", color: "#4e73df" },
    { name: "Profile", icon: <FaUser />, path: "/dashboard/profile", color: "#1cc88a" },
    {
      name: "Sign Out",
      icon: <FaSignOutAlt />,
      path: "/signin",
      color: "#e74a3b",
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clear session storage
      sessionStorage.removeItem("user");
      // Clear any other relevant storage
      localStorage.removeItem("user");
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Box
      sx={{
        width: isOpen ? "240px" : "80px",
        height: "100vh",
        backgroundColor: "#0f1728",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        paddingTop: "20px",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1000,
        transition: "width 0.3s ease",
        overflowX: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      <Button
        onClick={toggleSidebar}
        sx={{
          color: "#fff",
          minWidth: "40px",
          alignSelf: "flex-start",
          marginLeft: "15px",
          marginBottom: "30px",
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: "8px",
          padding: "10px",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.2)",
          },
        }}
      >
        <FaBars />
      </Button>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "0 10px",
          marginTop: "20px",
        }}
      >
        {sidebarButtons.map((button) => (
          <Button
            key={button.name}
            component={Link}
            to={button.path}
            onClick={() => {
              if (button.name === "Sign Out") {
                handleSignOut();  // Sign out when clicking the "Sign Out" button
              } else {
                setActiveButton(button.name);
              }
            }}
            sx={{
              color: "#fff",
              justifyContent: isOpen ? "flex-start" : "center",
              textTransform: "none",
              borderRadius: "8px",
              padding: isOpen ? "12px 20px" : "12px 0",
              backgroundColor:
                activeButton === button.name ? button.color : "transparent",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
              "&:before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: "4px",
                backgroundColor: button.color,
                transform:
                  activeButton === button.name ? "scaleY(1)" : "scaleY(0)",
                transformOrigin: "bottom",
                transition: "transform 0.3s ease",
              },
              "&:hover": {
                backgroundColor:
                  activeButton === button.name
                    ? button.color
                    : "rgba(255,255,255,0.1)",
                "&:before": {
                  transform: "scaleY(1)",
                },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                fontSize: "1.1rem",
              }}
            >
              <Box
                sx={{
                  color: activeButton === button.name ? "#fff" : button.color,
                  fontSize: "1.2rem",
                }}
              >
                {button.icon}
              </Box>
              {isOpen && (
                <Typography
                  sx={{
                    fontWeight: activeButton === button.name ? "bold" : "normal",
                    fontFamily: "Raleway, sans-serif",
                  }}
                >
                  {button.name}
                </Typography>
              )}
            </Box>
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default Sidebar;
