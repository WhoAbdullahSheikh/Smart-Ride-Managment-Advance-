import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { FaBars, FaHome, FaUser, FaSignOutAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ isOpen, toggleSidebar, activeButton, setActiveButton }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarButtons = [
    { name: "Home", icon: <FaHome />, path: "/dashboard", color: "#4e73df" },
    {
      name: "Profile",
      icon: <FaUser />,
      path: "/dashboard/profile",
      color: "#1cc88a",
    },
  ];

  const sidebarVariants = {
    open: { width: 240 },
    closed: { width: 80 },
  };

  const buttonVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -20 },
  };

  return (
    <motion.div
      initial={isOpen ? "open" : "closed"}
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      style={{
        height: "99vh",
        backgroundColor: "#0f1728",
        color: "#fff",
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
          color: "#fff",
          minWidth: "50px",
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
          <motion.div
            key={button.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              component={Link}
              to={button.path}
              onClick={() => {
                setActiveButton(button.name);
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
                width: "100%",
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
                          fontWeight:
                            activeButton === button.name ? "bold" : "normal",
                          fontFamily: "Raleway, sans-serif",
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
        ))}
      </Box>
    </motion.div>
  );
};

export default Sidebar;
