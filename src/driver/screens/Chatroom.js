
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  FaPaperPlane,
  FaTimes,
  FaEllipsisV,
  FaSmile,
  FaTrash,
  FaComment,
  FaExclamationTriangle,
} from "react-icons/fa";
import { motion } from "framer-motion";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  limit,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import Picker from "emoji-picker-react";

const Chatroom = ({ isOpen, toggleChatroom, unreadCount, clearUnread }) => {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const messagesEndRef = useRef(null);
  const chatHeaderRef = useRef(null);

  const getDeviceId = useCallback(() => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }, []);

  const fetchMessages = useCallback(() => {
    setLoading(true);
    const q = query(
      collection(db, "messages"),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMessages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(newMessages.reverse());
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      clearUnread();
    }
  }, [isOpen, unreadCount, clearUnread]);

  useEffect(() => {
    const unsubscribe = fetchMessages();
    return () => unsubscribe();
  }, [fetchMessages]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newMessage.trim()) {
        setSnackbar({
          open: true,
          message: "Message cannot be empty",
          severity: "error",
        });
        return;
      }

      const tempId = `temp-${Date.now()}`;
      try {
        // Determine user type and set appropriate display name
        let displayName = "Driver";
        let isAdmin = false;
        
        if (user) {
          // Check if user is admin
          const adminDoc = await getDoc(doc(db, "admin", "userdata"));
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            const adminEntry = Object.entries(adminData).find(
              ([key, value]) => value.email === user.email
            );
            
            if (adminEntry) {
              displayName = "Administrator";
              isAdmin = true;
            } else {
              // Check if user is a driver
              const driverQuery = query(
                collection(db, "drivers"),
                where("userData.email", "==", user.email)
              );
              const driverSnapshot = await getDocs(driverQuery);
              
              if (!driverSnapshot.empty) {
                const driverData = driverSnapshot.docs[0].data().userData;
                displayName = driverData.displayName || "Driver";
              }
            }
          }
        }

        const messageData = {
          text: newMessage,
          timestamp: serverTimestamp(),
          displayName,
          isAdmin,
          ...(user
            ? {
                uid: user.uid,
                photoURL: user.photoURL || "",
                isAuthenticated: true,
              }
            : {
                deviceId: getDeviceId(),
                isAuthenticated: false,
              }),
        };

        // Optimistic UI update
        const optimisticMessage = {
          id: tempId,
          ...messageData,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        setNewMessage("");
        setShowEmojiPicker(false);

        await addDoc(collection(db, "messages"), messageData);

      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setSnackbar({
          open: true,
          message: "Failed to send message",
          severity: "error",
        });
      }
    },
    [newMessage, user, getDeviceId]
  );

  const handleDeleteMessage = useCallback(async () => {
    if (!selectedMessage) return;

    try {
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== selectedMessage.id)
      );
      await deleteDoc(doc(db, "messages", selectedMessage.id));
    } catch (error) {
      console.error("Error deleting message:", error);
      setMessages((prev) => [...prev, selectedMessage]);
      setSnackbar({
        open: true,
        message: "Failed to delete message",
        severity: "error",
      });
    }
    setDeleteDialogOpen(false);
    setAnchorEl(null);
    setSelectedMessage(null);
  }, [selectedMessage]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const handleMenuOpen = useCallback((event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedMessage(null);
  }, []);

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  const onEmojiClick = useCallback((emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  }, []);

  const chatroomVariants = {
    open: { width: 400, opacity: 1 },
    closed: { width: 0, opacity: 0 },
  };

  const MessageItem = React.memo(({ message, isCurrentUser }) => {
    const isCurrentUserMessage = 
      (user && message.uid === user.uid) || 
      (!user && message.deviceId === getDeviceId());
    
    const isAdmin = message.isAdmin;
    const isDriver = message.displayName === "Driver" && !isAdmin;
    const isGuest = !message.isAuthenticated;

    // Determine colors based on user type
    const backgroundColor = isAdmin 
      ? "rgba(255, 165, 0, 0.3)" // Orange for admin
      : isDriver 
        ? "rgba(30, 144, 255, 0.3)" // Blue for driver
        : isCurrentUserMessage
          ? "rgba(46, 125, 50, 0.5)" // Green for current user
          : "rgba(255, 255, 255, 0.1)"; // White for others

    const borderColor = isAdmin 
      ? "1px solid rgba(255, 165, 0, 0.5)" 
      : isDriver 
        ? "1px solid rgba(30, 144, 255, 0.5)"
        : "none";

    const textColor = isAdmin 
      ? "rgba(255, 255, 255, 0.9)" 
      : isDriver 
        ? "rgba(255, 255, 255, 0.9)"
        : "white";

    const avatarColor = isAdmin 
      ? "#FFA500" 
      : isDriver 
        ? "#1E90FF"
        : "#3B82F6";

    const nameColor = isAdmin 
      ? "#FFA500" 
      : isDriver 
        ? "#1E90FF"
        : "white";

    return (
      <ListItem
        sx={{
          padding: "4px 0",
          alignItems: "flex-start",
          justifyContent: isCurrentUserMessage ? "flex-end" : "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            marginTop: "10px",
            flexDirection: isCurrentUserMessage ? "row-reverse" : "row",
            alignItems: "flex-start",
            maxWidth: "80%",
            gap: "5px",
            position: "relative",
          }}
        >
          {isCurrentUserMessage && (
            <>
              <IconButton
                size="small"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  "&:hover": {
                    color: "white",
                    backgroundColor: "rgba(0,0,0,0.5)",
                  },
                  width: 28,
                  height: 28,
                }}
                onClick={(e) => handleMenuOpen(e, message)}
              >
                <FaEllipsisV size={12} />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl) && selectedMessage?.id === message.id}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleDeleteClick}>
                  <ListItemIcon sx={{ color: "#ef4444" }}>
                    <FaTrash size={14} />
                  </ListItemIcon>
                  <ListItemText primary="Delete" sx={{ color: "#ef4444" }} />
                </MenuItem>
              </Menu>
            </>
          )}

          <Avatar
            src={message.photoURL}
            sx={{
              width: 32,
              height: 32,
              backgroundColor: avatarColor,
            }}
          >
            {message.displayName?.charAt(0)}
          </Avatar>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <Box
              sx={{
                backgroundColor,
                borderRadius: "12px",
                padding: "8px 12px",
                border: borderColor,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: textColor,
                }}
              >
                {message.text}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: isAdmin || isDriver 
                    ? "rgba(255, 255, 255, 0.7)" 
                    : "rgba(255,255,255,0.6)",
                }}
              >
                {formatTime(message.timestamp)}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: nameColor,
              }}
            >
              {message.displayName}
            </Typography>
          </Box>
        </Box>
      </ListItem>
    );
  });

  return (
    <motion.div
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      variants={chatroomVariants}
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        backgroundColor: "#0f1728",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "16px",
          color: "white",
        }}
      >
        <Box
          ref={chatHeaderRef}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "26px",
            marginBottom: "16px",
            height: "64px",
            flexShrink: 0,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "white" }}>
            Driver Chat
            <FaComment size={28} style={{ marginLeft: "5px" }} />
          </Typography>
          <Box>
            <Tooltip title="Close chat">
              <IconButton
                size="small"
                onClick={toggleChatroom}
                sx={{ color: "white" }}
              >
                <FaTimes size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider
          sx={{
            marginBottom: "16px",
            backgroundColor: "rgba(255,255,255,0.1)",
            flexShrink: 0,
          }}
        />

        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            marginBottom: "16px",
            paddingRight: "8px",
            height: "calc(100vh - 64px - 32px - 68px)",
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: "3px",
            },
            display: "flex",
            flexDirection: "column",
            justifyContent: loading ? "center" : "flex-start",
            alignItems: "center",
          }}
        >
          {loading ? (
            <CircularProgress sx={{ color: "white" }} />
          ) : (
            <List sx={{ padding: 0, width: "100%" }}>
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isCurrentUser={message.uid === user?.uid}
                />
              ))}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>

        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            position: "relative",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
            height: "68px",
          }}
        >
          {showEmojiPicker && (
            <Box
              sx={{ position: "absolute", bottom: "60px", right: 0, zIndex: 1 }}
            >
              <Picker
                onEmojiClick={onEmojiClick}
                pickerStyle={{
                  width: "280px",
                  boxShadow: "none",
                  border: "1px solid #e0e0e0",
                }}
              />
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Tooltip title="Emoji">
              <IconButton
                size="small"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                sx={{ color: "grey" }}
              >
                <FaSmile size={24} />
              </IconButton>
            </Tooltip>

            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "20px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "white",
                  "& fieldset": {
                    borderColor: "green",
                    borderWidth: "2px",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "green",
                  },
                  "& input::placeholder": {
                    color: "rgba(255,255,255,0.5)",
                  },
                },
                "& .MuiInputBase-input": {
                  color: "white",
                },
              }}
            />

            <Tooltip title="Send">
              <IconButton
                type="submit"
                disabled={!newMessage.trim()}
                sx={{
                  backgroundColor: "green",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#9eeb8f",
                  },
                  "&:disabled": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.3)",
                  },
                }}
              >
                <FaPaperPlane size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          <Box display="flex" alignItems="center" gap={1}>
            <FaExclamationTriangle color="#ff9800" />
            <Typography variant="h6" sx={{ ml: 1 }}>
              Delete Message
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this message? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteMessage}
            color="error"
            variant="contained"
            startIcon={<FaTrash />}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: "#1e293b",
            color: "white",
          },
        }}
      >
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon sx={{ color: "#ef4444" }}>
            <FaTrash size={16} />
          </ListItemIcon>
          <ListItemText
            primary="Delete"
            primaryTypographyProps={{ color: "#ef4444" }}
          />
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default React.memo(Chatroom);