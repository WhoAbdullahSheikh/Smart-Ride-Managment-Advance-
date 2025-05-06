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
} from "@mui/material";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEllipsisVertical, 
  faTrash, 
  faBan, 
  faCircleCheck 
} from '@fortawesome/free-solid-svg-icons';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setSnackbar({
        open: true,
        message: "Failed to load users",
        severity: "error",
      });
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleSuspendClick = () => {
    setSuspendDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteUser = async () => {
    try {
      await deleteDoc(doc(db, "users", selectedUser.id));
      setUsers(users.filter((user) => user.id !== selectedUser.id));
      setSnackbar({
        open: true,
        message: "User deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete user",
        severity: "error",
      });
    }
    setDeleteDialogOpen(false);
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus =
        selectedUser.status === "active" ? "suspended" : "active";
      await updateDoc(doc(db, "users", selectedUser.id), {
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
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          User Management
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="users table">
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                          src={user.photoURL || ""}
                          sx={{ mr: 2, bgcolor: "primary.main" }}
                        >
                          {user.name?.charAt(0) || "U"}
                        </Avatar>
                        {user.email}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.name || "N/A"}</TableCell>
                    <TableCell>{user.phone || "N/A"}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.status || "active"}
                        color={user.status === "active" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="actions"
                        onClick={(e) => handleMenuOpen(e, user)}
                      >
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                      </IconButton>
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
        >
          <MenuItem onClick={handleSuspendClick}>
            <ListItemIcon>
              <FontAwesomeIcon 
                icon={selectedUser?.status === "active" ? faBan : faCircleCheck} 
                fontSize="small" 
              />
            </ListItemIcon>
            <ListItemText>
              {selectedUser?.status === "active" ? "Suspend" : "Activate"}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <FontAwesomeIcon icon={faTrash} fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Confirm User Deletion"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to permanently delete{" "}
              {selectedUser?.name || "this user"}? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteUser} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {}
        <Dialog
          open={suspendDialogOpen}
          onClose={() => setSuspendDialogOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {selectedUser?.status === "active"
              ? "Confirm User Suspension"
              : "Confirm User Activation"}
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
            <Button onClick={() => setSuspendDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleToggleStatus} color="primary" autoFocus>
              {selectedUser?.status === "active" ? "Suspend" : "Activate"}
            </Button>
          </DialogActions>
        </Dialog>

        {!loading && users.length === 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              border: "1px dashed #ccc",
              borderRadius: 2,
              mt: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No users found
            </Typography>
          </Box>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};

export default Users;