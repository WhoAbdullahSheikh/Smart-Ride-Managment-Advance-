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
  const messagesEndRef = useRef(null);
  const chatHeaderRef = useRef(null);

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
      if (!newMessage.trim() || !user) return;

      const tempId = `temp-${Date.now()}`;
      try {
        const optimisticMessage = {
          id: tempId,
          text: newMessage,
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setNewMessage("");
        setShowEmojiPicker(false);

        await addDoc(collection(db, "messages"), {
          text: newMessage,
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          timestamp: serverTimestamp(),
        });

        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    },
    [newMessage, user]
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
    }
    setDeleteDialogOpen(false);
    setAnchorEl(null);
    setSelectedMessage(null);
  }, [selectedMessage]);

  const handleMenuOpen = useCallback((event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedMessage(null);
  }, []);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    setAnchorEl(null);
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
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    return (
      <ListItem
        sx={{
          padding: "4px 0",
          alignItems: "flex-start",
          justifyContent: isCurrentUser ? "flex-end" : "flex-start",
        }}
      >
        <Box
          sx={{
            display: "flex",
            marginTop: "10px",
            flexDirection: isCurrentUser ? "row-reverse" : "row",
            alignItems: "flex-start",
            maxWidth: "80%",
            gap: "5px",
            position: "relative",
          }}
        >
          {/* Three dots menu button - positioned on the left side */}
          {isCurrentUser && (
            <>
              <IconButton
                size="small"
                sx={{
                    color: "rgba(255,255,255,0.7)",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    '&:hover': {
                      color: "white",
                      backgroundColor: "rgba(0,0,0,0.5)",
                    },
                    width: 28,
                    height: 28,
                  }}
                onClick={handleMenuOpen}
              >
                <FaEllipsisV size={12} />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: "center",
                  horizontal: isCurrentUser ? "left" : "right",
                }}
                transformOrigin={{
                  vertical: "center",
                  horizontal: isCurrentUser ? "right" : "left",
                }}
                PaperProps={{
                  sx: {
                    backgroundColor: "#1e293b",
                    color: "white",
                    boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
                    minWidth: "120px",
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    setSelectedMessage(message);
                    setDeleteDialogOpen(true);
                    handleMenuClose();
                  }}
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <ListItemIcon>
                    <FaTrash size={14} color="#ef4444" />
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
              backgroundColor: message.photoURL ? "transparent" : "#3B82F6",
            }}
          >
            {message.displayName?.charAt(0)}
          </Avatar>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              position: "relative",
            }}
          >
            <Box
              sx={{
                backgroundColor: isCurrentUser
                  ? "rgba(46, 125, 50, 0.5)"
                  : "rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "8px 12px",
                position: "relative",
                maxWidth: "100%",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  wordBreak: "break-word",
                  fontSize: "0.875rem",
                  color: "white",
                  paddingRight: "45px",
                }}
              >
                {message.text}
              </Typography>

              <Box
                sx={{
                  position: "absolute",
                  right: "5px",
                  bottom: "0px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.60rem",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {formatTime(message.timestamp)}
                </Typography>
              </Box>
            </Box>
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: "0.75rem",
                color: "white",
                textAlign: isCurrentUser ? "right" : "left",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "#949494",
                  textAlign: isCurrentUser ? "right" : "left",
                }}
              >
                sent by
              </Typography>
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
        boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
        zIndex: 1000,
        overflow: "hidden",
        borderLeft: "1px solid #e0e0e0",
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
            Chat
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

      {/* Enhanced Delete Confirmation Dialog */}
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

      {/* Enhanced Message Options Menu */}
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
    </motion.div>
  );
};

export default React.memo(Chatroom);
