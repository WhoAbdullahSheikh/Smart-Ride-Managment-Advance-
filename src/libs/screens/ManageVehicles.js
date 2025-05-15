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
  TextField,
  InputAdornment,
  CircularProgress,
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
  faCheckCircle,
  faCar,
  faSearch,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import VehicleRegistration from "./VehicleRegistration";
import { useNavigate } from "react-router-dom";

const ManageVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "vehicles"));
      const vehiclesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVehicles(vehiclesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setSnackbar({
        open: true,
        message: "Failed to load vehicles",
        severity: "error",
      });
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, vehicle) => {
    setAnchorEl(event.currentTarget);
    setSelectedVehicle(vehicle);
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

  const handleEditClick = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteVehicle = async () => {
    try {
      await deleteDoc(doc(db, "vehicles", selectedVehicle.id));
      setVehicles(
        vehicles.filter((vehicle) => vehicle.id !== selectedVehicle.id)
      );
      setSnackbar({
        open: true,
        message: "Vehicle deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete vehicle",
        severity: "error",
      });
    }
    setDeleteDialogOpen(false);
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus =
        selectedVehicle.status === "active" ? "inactive" : "active";
      await updateDoc(doc(db, "vehicles", selectedVehicle.id), {
        status: newStatus,
        updatedAt: new Date(),
      });

      setVehicles(
        vehicles.map((vehicle) =>
          vehicle.id === selectedVehicle.id
            ? { ...vehicle, status: newStatus }
            : vehicle
        )
      );

      setSnackbar({
        open: true,
        message: `Vehicle ${
          newStatus === "active" ? "activated" : "deactivated"
        } successfully`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating vehicle status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update vehicle status",
        severity: "error",
      });
    }
    setStatusDialogOpen(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isBase64Image = (str) => {
    if (typeof str !== "string") return false;
    return str.startsWith("data:image");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" gutterBottom>
            Vehicle Management
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/dashboard/vehicles/register")}
            startIcon={<FontAwesomeIcon icon={faCar} />}
            sx={{
              backgroundColor: "#0f1728",
              "&:hover": { backgroundColor: "#1e293b" },
            }}
          >
            Add New Vehicle
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Search vehicles..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FontAwesomeIcon icon={faSearch} />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, mb: 3 },
          }}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
          >
            <Table sx={{ minWidth: 650 }} aria-label="vehicles table">
              <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                <TableRow>
                  <TableCell>Vehicle</TableCell> {}
                  <TableCell align="center">Plate Number</TableCell>
                  <TableCell align="center">Make</TableCell>
                  <TableCell align="center">Model</TableCell>
                  <TableCell align="center">Year</TableCell>
                  <TableCell align="center">Type</TableCell>
                  <TableCell align="center">Registration Expiry</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    {}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                          src={
                            isBase64Image(vehicle.vehicleImage)
                              ? vehicle.vehicleImage
                              : undefined
                          }
                          sx={{
                            mr: 2,
                            bgcolor: isBase64Image(vehicle.vehicleImage)
                              ? "transparent"
                              : "#e2e8f0",
                            width: 40,
                            height: 40,
                          }}
                        >
                          {!isBase64Image(vehicle.vehicleImage) && (
                            <FontAwesomeIcon icon={faCar} />
                          )}
                        </Avatar>
                        {vehicle.make} {vehicle.model}
                      </Box>
                    </TableCell>

                    {}
                    <TableCell
                      align="center"
                      sx={{ fontFamily: "monospace", fontWeight: 600 }}
                    >
                      {vehicle.plateNumber}
                    </TableCell>
                    <TableCell align="center">{vehicle.make}</TableCell>
                    <TableCell align="center">{vehicle.model}</TableCell>
                    <TableCell align="center">{vehicle.year}</TableCell>
                    <TableCell align="center">
                      {vehicle.vehicleType || "N/A"}
                    </TableCell>
                    <TableCell align="center">
                      {formatDate(vehicle.registrationExpiry)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={vehicle.status}
                        color={
                          vehicle.status === "active"
                            ? "success"
                            : vehicle.status === "maintenance"
                            ? "warning"
                            : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        aria-label="actions"
                        onClick={(e) => handleMenuOpen(e, vehicle)}
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

        {!loading && filteredVehicles.length === 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              border: "1px dashed #e2e8f0",
              borderRadius: 2,
              mt: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? "No matching vehicles found" : "No vehicles found"}
            </Typography>
          </Box>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={handleEditClick}>
            <ListItemIcon>
              <FontAwesomeIcon icon={faEdit} color="#3b82f6" />
            </ListItemIcon>
            <ListItemText>Edit Vehicle</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleStatusClick}>
            <ListItemIcon>
              {selectedVehicle?.status === "active" ? (
                <FontAwesomeIcon icon={faBan} color="#f59e0b" />
              ) : (
                <FontAwesomeIcon icon={faCheckCircle} color="#10b981" />
              )}
            </ListItemIcon>
            <ListItemText>
              {selectedVehicle?.status === "active" ? "Deactivate" : "Activate"}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <FontAwesomeIcon icon={faTrash} color="#ef4444" />
            </ListItemIcon>
            <ListItemText>Delete Vehicle</ListItemText>
          </MenuItem>
        </Menu>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {"Confirm Vehicle Deletion"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to permanently delete{" "}
              {selectedVehicle?.make} {selectedVehicle?.model} (
              {selectedVehicle?.plateNumber})? This action cannot be undone.
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
              onClick={handleDeleteVehicle}
              color="error"
              variant="contained"
              autoFocus
            >
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
            {selectedVehicle?.status === "active"
              ? "Confirm Vehicle Deactivation"
              : "Confirm Vehicle Activation"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {selectedVehicle?.status === "active"
                ? `Are you sure you want to deactivate ${selectedVehicle?.make} ${selectedVehicle?.model} (${selectedVehicle?.plateNumber})?`
                : `Are you sure you want to activate ${selectedVehicle?.make} ${selectedVehicle?.model} (${selectedVehicle?.plateNumber})?`}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setStatusDialogOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleStatus}
              color="primary"
              variant="contained"
              autoFocus
            >
              {selectedVehicle?.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            {selectedVehicle &&
              `Edit Vehicle - ${selectedVehicle.make} ${selectedVehicle.model}`}
          </DialogTitle>
          <DialogContent>
            {selectedVehicle && (
              <VehicleRegistration
                editMode={true}
                vehicleData={selectedVehicle}
                onClose={() => {
                  setEditDialogOpen(false);
                  fetchVehicles();
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              alignItems: "center",
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};

export default ManageVehicles;
