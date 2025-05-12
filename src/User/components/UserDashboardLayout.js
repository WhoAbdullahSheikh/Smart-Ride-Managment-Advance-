import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, IconButton, Badge, Tooltip } from "@mui/material";
import Sidebar from "../screens/userSidebar";
import Chatroom from "../screens/Chatroom";
import { FaComment } from "react-icons/fa";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const UserDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatroomOpen, setIsChatroomOpen] = useState(false);
  const [activeButton, setActiveButton] = useState("Home");
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeen, setLastSeen] = useState(null);
  const [user] = useAuthState(auth);
  const location = useLocation();

  useEffect(() => {
    const pathToButtonMap = {
      "/userdashboard": "Home",
      "/userdashboard/userprofile": "Profile",
      "/userdashboard/viewroutes": "Routes",
      "/userdashboard/bookinghistory": "Booking History",
    };

    const currentButton =
      Object.entries(pathToButtonMap).find(
        ([path]) => location.pathname === path
      )?.[1] || "Home";

    setActiveButton(currentButton);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;

    setLastSeen(new Date());

    const q = query(
      collection(db, "messages"),
      where("timestamp", ">", new Date())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isChatroomOpen) {
        setUnreadCount((prev) => prev + snapshot.docChanges().length);
      }
    });

    return () => unsubscribe();
  }, [user, isChatroomOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleChatroom = () => {
    setIsChatroomOpen(!isChatroomOpen);
    if (!isChatroomOpen) {
      setUnreadCount(0);
    }
  };

  const clearUnread = () => {
    setUnreadCount(0);
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

      {}
      {!isChatroomOpen && (
        <Badge
          badgeContent={unreadCount}
          color="error"
          overlap="circular"
          sx={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 1200,
          }}
        >
          <Tooltip title="Open chat">
            <IconButton
              onClick={toggleChatroom}
              sx={{
                backgroundColor: "#0f1728",
                color: "white",
                "&:hover": {
                  backgroundColor: "#293e6e",
                },
                transition: "transform 0.3s ease",
                width: 56,
                height: 56,
              }}
            >
              <FaComment size={30} />
            </IconButton>
          </Tooltip>
        </Badge>
      )}

      {}
      <Chatroom
        isOpen={isChatroomOpen}
        toggleChatroom={toggleChatroom}
        unreadCount={unreadCount}
        clearUnread={clearUnread}
      />
    </Box>
  );
};

export default UserDashboardLayout;
