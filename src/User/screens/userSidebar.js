import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Typography, Divider } from "@mui/material";
import { FaBars, FaHome, FaUser, FaRoute, FaUsers, FaCar, FaSignOutAlt, FaHistory, FaMoneyBill, FaRegComment } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const Sidebar = ({ isOpen, toggleSidebar, activeButton, setActiveButton }) => {
  const navigate = useNavigate();

  const colors = {
    sidebarBg: "#0f1728",
    textPrimary: "#F8FAFC",
    textSecondary: "#fff",
    activeBg: "rgba(59, 130, 246, 0.1)",
    activeBorder: "#3B82F6",
    hoverBg: "rgba(255, 255, 255, 0.05)",
    iconActive: "#3B82F6",
    iconInactive: "#94A3B8",
    toggleButton: "rgba(255, 255, 255, 0.1)",
    toggleButtonHover: "rgba(255, 255, 255, 0.15)",
    divider: "rgba(255, 255, 255, 0.4)",
  };

  const mainButtons = [
    { 
      name: "Home", 
      icon: <FaHome />, 
      path: "/userdashboard"
    },
    {
      name: "Routes",
      icon: <FaRoute />,
      path: "/userdashboard/viewroutes"
    },
    {
      name: "Booking History",
      icon: <FaHistory />,
      path: "/userdashboard/bookinghistory"
    },
    {
      name: "Payment",
      icon: <FaMoneyBill />,
      path: "/userdashboard/payment"
    },
    {
      name: "Feedback and Complaints",
      icon: <FaRegComment />,
      path: "/userdashboard/feedbackandcomplaints",
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const bottomButtons = [
    {
      name: "Profile",
      icon: <FaUser />,
      path: "/userdashboard/userprofile"
    },
    {
      name: "Sign Out",
      icon: <FaSignOutAlt />,
      action: handleSignOut,
      color: "#e74a3b",
      hoverColor: "rgba(231, 73, 59, 0.1)"
    }
  ];

  const sidebarVariants = {
    open: { width: 240 },
    closed: { width: 80 },
  };

  const buttonVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -20 },
  };

  const renderButton = (button) => (
    <motion.div
      key={button.name}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        component={button.path ? Link : undefined}
        to={button.path}
        onClick={() => {
          if (button.path) setActiveButton(button.name);
          if (button.action) button.action();
        }}
        sx={{
          color: activeButton === button.name ? colors.textPrimary : colors.textSecondary,
          justifyContent: isOpen ? "flex-start" : "center",
          textTransform: "none",
          borderRadius: "8px",
          padding: isOpen ? "12px 20px" : "12px 0",
          backgroundColor: activeButton === button.name ? colors.activeBg : "transparent",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
          width: "100%",
          "&:before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "4px",
            backgroundColor: colors.activeBorder,
            transform: activeButton === button.name ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: "bottom",
            transition: "transform 0.3s ease",
          },
          "&:hover": {
            backgroundColor: activeButton === button.name 
              ? colors.activeBg 
              : button.hoverColor || colors.hoverBg,
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
              color: activeButton === button.name 
                ? colors.iconActive 
                : button.color || colors.iconInactive,
              fontSize: "1.2rem",
              transition: "color 0.3s ease",
            }}
          >
            {button.icon}
          </Box>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={buttonVariants}
                transition={{ duration: 0.2 }}
              >
                <Typography
                  sx={{
                    fontWeight: activeButton === button.name ? "600" : "400",
                    fontFamily: "Raleway, sans-serif",
                    fontSize: "0.95rem",
                    color: button.color ? button.color : undefined,
                  }}
                >
                  {button.name}
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Button>
    </motion.div>
  );

  return (
    <motion.div
      initial={isOpen ? "open" : "closed"}
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      style={{
        height: "99vh",
        backgroundColor: colors.sidebarBg,
        color: colors.textPrimary,
        display: "flex",
        flexDirection: "column",
        paddingTop: "20px",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1000,
        overflowX: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        borderTopRightRadius: "30px",
        borderBottomRightRadius: "30px",
      }}
    >
      <Button
        onClick={toggleSidebar}
        sx={{
          color: colors.textPrimary,
          minWidth: "50px",
          alignSelf: "flex-start",
          marginLeft: "15px",
          marginBottom: "30px",
          backgroundColor: colors.toggleButton,
          borderRadius: "8px",
          padding: "10px",
          "&:hover": {
            backgroundColor: colors.toggleButtonHover,
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
          flexGrow: 1,
        }}
      >
        {mainButtons.map(renderButton)}
      </Box>

      <Box
        sx={{
          padding: "0 10px",
          marginBottom: "20px",
        }}
      >
        <Divider sx={{ borderColor: colors.divider, marginBottom: "10px" }} />
        {bottomButtons.map(renderButton)}
      </Box>
    </motion.div>
  );
};

export default Sidebar;