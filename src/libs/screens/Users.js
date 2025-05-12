import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
  Tooltip,
  Badge,
  Stack,
} from "@mui/material";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import {
  FaEllipsisV,
  FaTrash,
  FaBan,
  FaCheckCircle,
  FaGoogle,
  FaEnvelope,
  FaUser,
  FaCalendarAlt,
  FaSignInAlt,
  FaInfoCircle,
  FaSync,
} from "react-icons/fa";

const Users = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [googleSnapshot, emailSnapshot] = await Promise.all([
        getDocs(collection(db, "google")),
        getDocs(collection(db, "email")),
      ]);

      const googleUsers = googleSnapshot.docs.map((doc) => ({
        id: doc.id,
        collection: "google",
        ...doc.data(),
        signUpMethod: "Google",
      }));

      const emailUsers = emailSnapshot.docs.map((doc) => ({
        id: doc.id,
        collection: "email",
        ...doc.data(),
        signUpMethod: "Email",
      }));

      const combinedUsers = [...googleUsers, ...emailUsers].map((user) => ({
        id: user.id,
        collection: user.collection,
        name: user.displayName || user.userData?.displayName || "N/A",
        email: user.email || user.userData?.email || "N/A",
        photoURL: user.photoURL || user.userData?.photoURL || null,
        username: user.username || user.userData?.username || "N/A",
        phone: user.phone || "N/A",
        createdAt: user.createdAt || user.userData?.createdAt || null,
        emailVerified:
          user.emailVerified || user.userData?.emailVerified || false,
        status: user.status || "active",
        signUpMethod: user.signUpMethod,
        loginActivities: user.loginActivities || [],
      }));

      setUsers(combinedUsers);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setSnackbar({
        open: true,
        message: "Failed to load users",
        severity: "error",
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // First delete the user
      await deleteDoc(doc(db, selectedUser.collection, selectedUser.id));

      // Then delete all messages associated with this user's uid
      const messagesRef = collection(db, "messages");
      const q = query(messagesRef, where("uid", "==", selectedUser.id));

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      // Wait for all deletions to complete
      await Promise.all(deletePromises);

      // Update local state
      setUsers(users.filter((user) => user.id !== selectedUser.id));
      setSnackbar({
        open: true,
        message: "User and all associated messages deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting user or messages:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete user and/or messages",
        severity: "error",
      });
    }
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    try {
      const newStatus =
        selectedUser.status === "active" ? "suspended" : "active";
      await updateDoc(doc(db, selectedUser.collection, selectedUser.id), {
        status: newStatus,
      });

      setUsers(
        users.map((user) =>
          user.id === selectedUser.id ? { ...user, status: newStatus } : user
        )
      );

      setSnackbar({
        open: true,
        message: `User ${
          newStatus === "active" ? "activated" : "suspended"
        } successfully`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update user status",
        severity: "error",
      });
    }
    setSuspendDialogOpen(false);
    setSelectedUser(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleSuspendClick = () => {
    setSuspendDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isSmallScreen) {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getSignUpMethodIcon = (method) => {
    if (method.includes("Google")) {
      return (
        <Tooltip title="Google Sign-In">
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FaGoogle color="#DB4437" />
            {!isSmallScreen && <span style={{ marginLeft: 8 }}>Google</span>}
          </Box>
        </Tooltip>
      );
    }
    return (
      <Tooltip title="Email Sign-In">
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <FaEnvelope color="#4285F4" />
          {!isSmallScreen && <span style={{ marginLeft: 8 }}>Email</span>}
        </Box>
      </Tooltip>
    );
  };

  const UserAvatar = ({ user }) => (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      badgeContent={
        user.emailVerified ? (
          <Tooltip title="Verified Email">
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: theme.palette.success.main,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaCheckCircle size={10} color="white" />
            </Box>
          </Tooltip>
        ) : null
      }
    >
      <Avatar
        src={user.photoURL || ""}
        sx={{
          width: 40,
          height: 40,
          bgcolor: theme.palette.primary.main,
          ...(isSmallScreen && { width: 32, height: 32 }),
        }}
      >
        {user.name?.charAt(0) || <FaUser size={16} />}
      </Avatar>
    </Badge>
  );

  const getLastLogin = (loginActivities) => {
    if (!loginActivities || loginActivities.length === 0) return "N/A";
    const lastLogin = loginActivities[loginActivities.length - 1].timestamp;
    return formatDate(lastLogin);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: isSmallScreen ? 1 : 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4">User Management</Typography>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<FaSync />}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 2,
              maxHeight: "calc(100vh - 200px)",
              overflow: "auto",
              boxShadow: theme.shadows[2],
            }}
          >
            <Table
              stickyHeader
              aria-label="users table"
              size={isSmallScreen ? "small" : "medium"}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", fontSize: "16px" }}
                  >
                    User
                  </TableCell>
                  {!isMediumScreen && (
                    <TableCell
                      align="center"
                      sx={{ fontWeight: "bold", fontSize: "16px" }}
                    >
                      Name
                    </TableCell>
                  )}
                  {!isSmallScreen && (
                    <TableCell
                      align="center"
                      sx={{ fontWeight: "bold", fontSize: "16px" }}
                    >
                      Username
                    </TableCell>
                  )}
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", fontSize: "16px" }}
                  >
                    <Tooltip title="Join Date">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <FaCalendarAlt size={14} />
                        {!isSmallScreen && "Joined"}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  {!isSmallScreen && (
                    <TableCell
                      align="center"
                      sx={{ fontWeight: "bold", fontSize: "16px" }}
                    >
                      <Tooltip title="Last Login">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            justifyContent: "center",
                          }}
                        >
                          <FaSignInAlt size={14} />
                          Last Login
                        </Box>
                      </Tooltip>
                    </TableCell>
                  )}
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", fontSize: "16px" }}
                  >
                    Method
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", fontSize: "16px" }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", fontSize: "16px" }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <UserAvatar user={user} />
                        {!isSmallScreen && (
                          <Box sx={{ overflow: "hidden" }}>
                            <Typography variant="body2" noWrap>
                              {user.email}
                            </Typography>
                            {isMediumScreen && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                noWrap
                              >
                                {user.name}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </TableCell>

                    {!isMediumScreen && (
                      <TableCell align="center">
                        <Tooltip title={user.name}>
                          <Typography noWrap>{user.name}</Typography>
                        </Tooltip>
                      </TableCell>
                    )}

                    {!isSmallScreen && (
                      <TableCell align="center">
                        <Tooltip title={user.username}>
                          <Typography noWrap>{user.username}</Typography>
                        </Tooltip>
                      </TableCell>
                    )}

                    <TableCell align="center">
                      <Tooltip title={formatDate(user.createdAt)}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 1,
                          }}
                        >
                          {!isSmallScreen && formatDate(user.createdAt)}
                        </Box>
                      </Tooltip>
                    </TableCell>

                    {!isSmallScreen && (
                      <TableCell align="center">
                        <Tooltip title={getLastLogin(user.loginActivities)}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
                            {getLastLogin(user.loginActivities)}
                          </Box>
                        </Tooltip>
                      </TableCell>
                    )}

                    <TableCell align="center">
                      {getSignUpMethodIcon(user.signUpMethod)}
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={
                          isSmallScreen ? user.status.charAt(0) : user.status
                        }
                        color={user.status === "active" ? "success" : "error"}
                        size={isSmallScreen ? "small" : "medium"}
                        sx={{
                          fontWeight: 600,
                          minWidth: isSmallScreen ? 24 : 80,
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="More actions">
                        <IconButton
                          aria-label="actions"
                          onClick={(e) => handleMenuOpen(e, user)}
                          size={isSmallScreen ? "small" : "medium"}
                        >
                          <FaEllipsisV />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleSuspendClick}>
            <ListItemIcon>
              {selectedUser?.status === "active" ? (
                <FaBan color={theme.palette.error.main} />
              ) : (
                <FaCheckCircle color={theme.palette.success.main} />
              )}
            </ListItemIcon>
            <ListItemText>
              {selectedUser?.status === "active" ? "Suspend" : "Activate"}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <FaTrash color={theme.palette.error.main} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            <Box display="flex" alignItems="center" gap={1}>
              <FaInfoCircle color={theme.palette.warning.main} />
              Confirm User Deletion
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to permanently delete{" "}
              <strong>{selectedUser?.name || "this user"}</strong>? This will
              also delete all messages associated with this user. This action
              cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              color="error"
              variant="contained"
              autoFocus
              startIcon={<FaTrash />}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={suspendDialogOpen}
          onClose={() => setSuspendDialogOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            <Box display="flex" alignItems="center" gap={1}>
              <FaInfoCircle color={theme.palette.warning.main} />
              {selectedUser?.status === "active"
                ? "Confirm User Suspension"
                : "Confirm User Activation"}
            </Box>
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {selectedUser?.status === "active"
                ? `Are you sure you want to suspend ${
                    selectedUser?.name || "this user"
                  }? They will lose access to their account.`
                : `Are you sure you want to activate ${
                    selectedUser?.name || "this user"
                  }? They will regain access to their account.`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setSuspendDialogOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleStatus}
              color="primary"
              variant="contained"
              autoFocus
              startIcon={
                selectedUser?.status === "active" ? (
                  <FaBan />
                ) : (
                  <FaCheckCircle />
                )
              }
            >
              {selectedUser?.status === "active" ? "Suspend" : "Activate"}
            </Button>
          </DialogActions>
        </Dialog>

        {!loading && users.length === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              gap: 2,
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2,
              mt: 2,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <FaUser size={32} color={theme.palette.text.disabled} />
            <Typography variant="body1" color="text.secondary">
              No users found
            </Typography>
            <Button
              variant="outlined"
              onClick={fetchUsers}
              startIcon={<FaCheckCircle />}
            >
              Refresh
            </Button>
          </Box>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
            iconMapping={{
              success: <FaCheckCircle />,
              error: <FaBan />,
              warning: <FaInfoCircle />,
              info: <FaInfoCircle />,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};

export default Users;
