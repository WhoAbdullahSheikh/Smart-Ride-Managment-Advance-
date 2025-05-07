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
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faTrash,
  faBan,
  faCircleCheck,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";

const ViewRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "routes"));
      const routesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRoutes(routesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching routes:", error);
      setSnackbar({
        open: true,
        message: "Failed to load routes",
        severity: "error",
      });
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, route) => {
    setAnchorEl(event.currentTarget);
    setSelectedRoute(route);
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

  const handleDeleteRoute = async () => {
    try {
      await deleteDoc(doc(db, "routes", selectedRoute.id));
      setRoutes(routes.filter((route) => route.id !== selectedRoute.id));
      setSnackbar({
        open: true,
        message: "Route deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting route:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete route",
        severity: "error",
      });
    }
    setDeleteDialogOpen(false);
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus =
        selectedRoute.status === "active" ? "inactive" : "active";
      await updateDoc(doc(db, "routes", selectedRoute.id), {
        status: newStatus,
        updatedAt: new Date(),
      });

      setRoutes(
        routes.map((route) =>
          route.id === selectedRoute.id
            ? { ...route, status: newStatus }
            : route
        )
      );

      setSnackbar({
        open: true,
        message: `Route ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating route status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update route status",
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

  const formatCoordinates = (coords) => {
    if (!coords) return "N/A";
    return `${coords.latitude?.toFixed(6)}, ${coords.longitude?.toFixed(6)}`;
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
          Route Management
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="routes table">
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>Route Name</TableCell>
                  <TableCell>Origin</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {routes.map((route) => (
                  <TableRow
                    key={route.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{route.name}</TableCell>
                    <TableCell>{route.origin}</TableCell>
                    <TableCell>{route.destination}</TableCell>
                    <TableCell>{formatDate(route.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        label={route.status || "active"}
                        color={route.status === "active" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="actions"
                        onClick={(e) => handleMenuOpen(e, route)}
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
                icon={
                  selectedRoute?.status === "active" ? faBan : faCircleCheck
                }
                fontSize="small"
              />
            </ListItemIcon>
            <ListItemText>
              {selectedRoute?.status === "active" ? "Deactivate" : "Activate"}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <FontAwesomeIcon icon={faTrash} fontSize="small" />
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
            {"Confirm Route Deletion"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to permanently delete the route{" "}
              {selectedRoute?.name || "this route"}? This action cannot be
              undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteRoute} color="error" autoFocus>
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
            {selectedRoute?.status === "active"
              ? "Confirm Route Deactivation"
              : "Confirm Route Activation"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {selectedRoute?.status === "active"
                ? `Are you sure you want to deactivate the route "${
                    selectedRoute?.name || "this route"
                  }"?`
                : `Are you sure you want to activate the route "${
                    selectedRoute?.name || "this route"
                  }"?`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleToggleStatus} color="primary" autoFocus>
              {selectedRoute?.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </DialogActions>
        </Dialog>

        {!loading && routes.length === 0 && (
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
              No routes found
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

export default ViewRoutes;
