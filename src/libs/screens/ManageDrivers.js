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


const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "drivers"));
      const driversData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data().userData,
        firebaseId: doc.id
      }));
      setDrivers(driversData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setSnackbar({
        open: true,
        message: "Failed to load drivers",
        severity: "error",
      });
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, driver) => {
    setAnchorEl(event.currentTarget);
    setSelectedDriver(driver);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusClick = () => {
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteDriver = async () => {
    try {
      await deleteDoc(doc(db, "drivers", selectedDriver.firebaseId));
      setDrivers(drivers.filter((driver) => driver.firebaseId !== selectedDriver.firebaseId));
      setSnackbar({
        open: true,
        message: "Driver deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting driver:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete driver",
        severity: "error",
      });
    }
    setDeleteDialogOpen(false);
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = selectedDriver.status === "active" ? "inactive" : "active";
      
      await updateDoc(doc(db, "drivers", selectedDriver.firebaseId), {
        "userData.status": newStatus,
        "userData.updatedAt": new Date()
      });

      setDrivers(
        drivers.map((driver) =>
          driver.firebaseId === selectedDriver.firebaseId 
            ? { ...driver, status: newStatus } 
            : driver
        )
      );

      setSnackbar({
        open: true,
        message: `Driver ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating driver status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update driver status",
        severity: "error",
      });
    }
    setStatusDialogOpen(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isBase64Image = (str) => {
    if (typeof str !== 'string') return false;
    return str.startsWith('data:image');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Driver Management
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="drivers table">
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>Driver</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>License Number</TableCell>
                  <TableCell>License Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow
                    key={driver.firebaseId}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                          src={isBase64Image(driver.profileImage) ? driver.profileImage : undefined}
                          sx={{ 
                            mr: 2, 
                            bgcolor: isBase64Image(driver.profileImage) ? 'transparent' : 'primary.main',
                            width: 40,
                            height: 40
                          }}
                        >
                          {!isBase64Image(driver.profileImage) && (driver.name?.charAt(0) || "D")}
                        </Avatar>
                        {driver.name}
                      </Box>
                    </TableCell>
                    <TableCell>{driver.email}</TableCell>
                    <TableCell>{driver.phone || "N/A"}</TableCell>
                    <TableCell>{driver.licenseNumber || "N/A"}</TableCell>
                    <TableCell>{driver.licenseType || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={driver.status || "pending"}
                        color={
                          driver.status === "active" 
                            ? "success" 
                            : driver.status === "on-leave"
                            ? "warning"
                            : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(driver.createdAt)}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="actions"
                        onClick={(e) => handleMenuOpen(e, driver)}
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
          <MenuItem onClick={handleStatusClick}>
            <ListItemIcon>
              <FontAwesomeIcon 
                icon={selectedDriver?.status === "active" ? faBan : faCircleCheck} 
                fontSize="small" 
                color={selectedDriver?.status === "active" ? "warning" : "success"}
              />
            </ListItemIcon>
            <ListItemText>
              {selectedDriver?.status === "active" ? "Deactivate" : "Activate"}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <FontAwesomeIcon icon={faTrash} fontSize="small" color="error" />
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
            {"Confirm Driver Deletion"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to permanently delete{" "}
              {selectedDriver?.name || "this driver"}? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteDriver} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {selectedDriver?.status === "active"
              ? "Confirm Driver Deactivation"
              : "Confirm Driver Activation"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {selectedDriver?.status === "active"
                ? `Are you sure you want to deactivate ${
                    selectedDriver?.name || "this driver"
                  }?`
                : `Are you sure you want to activate ${
                    selectedDriver?.name || "this driver"
                  }?`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleToggleStatus} color="primary" autoFocus>
              {selectedDriver?.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </DialogActions>
        </Dialog>

        {!loading && drivers.length === 0 && (
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
              No drivers found
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

export default Drivers;