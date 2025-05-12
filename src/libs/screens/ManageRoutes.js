import React, { useState, useEffect, useMemo } from "react";
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
  Chip,
  Tooltip,
  TextField,
  Select,
  FormControl,
  InputLabel,
  TableSortLabel,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faTrash,
  faEdit,
  faRoute,
  faSave,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { TrafficLayer } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "8px",
};

const libraries = ["places"];

const ManageRoutes = () => {
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    origin: "",
    destination: "",
    waypoints: [],
    status: "active",
  });
  const [originPosition, setOriginPosition] = useState(null);
  const [destinationPosition, setDestinationPosition] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeMarker, setActiveMarker] = useState("origin");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [sortOption, setSortOption] = useState("newest");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoutes();
  }, []);
  const generateRouteId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `route_${timestamp}_${randomStr}`;
  };
  const handleCreateRoute = async (routeData) => {
    try {
      const routeId = generateRouteId();
      const routeWithId = {
        ...routeData,
        routeId, // Add the generated unique ID
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "routes"), routeWithId);
      setSnackbar({
        open: true,
        message: "Route created successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error creating route:", error);
      setSnackbar({
        open: true,
        message: "Failed to create route",
        severity: "error",
      });
    }
  };
  const fetchRoutes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "routes"));
      const routesData = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Firestore document ID
        routeId: doc.data().routeId || doc.id, // Use custom ID or fallback to doc ID
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

  const handleSortOptionChange = (event, newOption) => {
    if (newOption !== null) {
      setSortOption(newOption);
      setSortConfig({
        key: "createdAt",
        direction: newOption === "newest" ? "desc" : "asc",
      });
    }
  };

  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const sortedRoutes = useMemo(() => {
    const sortableRoutes = [...routes];
    if (sortConfig.key) {
      sortableRoutes.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableRoutes;
  }, [routes, sortConfig]);

  const filteredRoutes = useMemo(() => {
    return sortedRoutes.filter((route) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        route.name.toLowerCase().includes(searchLower) ||
        route.origin.toLowerCase().includes(searchLower) ||
        route.destination.toLowerCase().includes(searchLower) ||
        route.status.toLowerCase().includes(searchLower) ||
        (route.waypoints &&
          route.waypoints.some((wp) => wp.toLowerCase().includes(searchLower)))
      );
    });
  }, [sortedRoutes, searchTerm]);

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

  const handleEditClick = () => {
    if (selectedRoute) {
      setEditForm({
        name: selectedRoute.name,
        origin: selectedRoute.origin,
        destination: selectedRoute.destination,
        waypoints: selectedRoute.waypoints || [],
        status: selectedRoute.status || "active",
      });
      setOriginPosition(
        selectedRoute.originCoordinates
          ? {
              lat: selectedRoute.originCoordinates.latitude,
              lng: selectedRoute.originCoordinates.longitude,
            }
          : null
      );
      setDestinationPosition(
        selectedRoute.destinationCoordinates
          ? {
              lat: selectedRoute.destinationCoordinates.latitude,
              lng: selectedRoute.destinationCoordinates.longitude,
            }
          : null
      );
      setEditDialogOpen(true);
    }
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

  const handleMapClick = (e) => {
    const newPosition = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };

    if (activeMarker === "origin") {
      setOriginPosition(newPosition);
      updateAddressFromCoordinates(newPosition, "origin");
    } else {
      setDestinationPosition(newPosition);
      updateAddressFromCoordinates(newPosition, "destination");
    }
  };

  const updateAddressFromCoordinates = async (position, field) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.lat}&longitude=${position.lng}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }

      const data = await response.json();
      const address =
        data.locality || data.principalSubdivision || data.countryName;

      setEditForm((prev) => ({
        ...prev,
        [field]: address,
      }));
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setSnackbar({
        open: true,
        message: "Failed to get address for this location",
        severity: "error",
      });
    }
  };

  const handleMarkerDragEnd = (e, markerType) => {
    const newPosition = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };

    if (markerType === "origin") {
      setOriginPosition(newPosition);
      updateAddressFromCoordinates(newPosition, "origin");
    } else {
      setDestinationPosition(newPosition);
      updateAddressFromCoordinates(newPosition, "destination");
    }
  };

  const handleAddressChange = async (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setActiveMarker(field);

    if (
      (field === "origin" || field === "destination") &&
      window.google &&
      window.google.maps
    ) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: value }, (results, status) => {
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;
          const newPosition = { lat: location.lat(), lng: location.lng() };

          if (field === "origin") {
            setOriginPosition(newPosition);
          } else {
            setDestinationPosition(newPosition);
          }
        }
      });
    }
  };

  const handleInputFocus = (field) => {
    setActiveMarker(field);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWaypointsChange = (e) => {
    const waypoints = e.target.value
      .split("\n")
      .map((wp) => wp.trim())
      .filter((wp) => wp !== "");
    setEditForm((prev) => ({
      ...prev,
      waypoints,
    }));
  };

  const handleUpdateRoute = async () => {
    try {
      if (!editForm.name || !editForm.origin || !editForm.destination) {
        setSnackbar({
          open: true,
          message: "Please fill all required fields",
          severity: "warning",
        });
        return;
      }

      const routeData = {
        ...editForm, // Include all form fields
        routeId: selectedRoute.routeId || generateRouteId(), // Use existing or generate new
        originCoordinates: {
          latitude: originPosition?.lat || null,
          longitude: originPosition?.lng || null,
        },
        destinationCoordinates: {
          latitude: destinationPosition?.lat || null,
          longitude: destinationPosition?.lng || null,
        },
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "routes", selectedRoute.id), routeData);

      setRoutes(
        routes.map((route) =>
          route.id === selectedRoute.id ? { ...route, ...routeData } : route
        )
      );

      setSnackbar({
        open: true,
        message: "Route updated successfully",
        severity: "success",
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating route: ", error);
      setSnackbar({
        open: true,
        message: "Failed to update route",
        severity: "error",
      });
    }
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4">Manage Routes</Typography>
          <Button
            variant="contained"
            startIcon={<FontAwesomeIcon icon={faRoute} />}
            onClick={() => navigate("/dashboard/createroutes")}
          >
            Create New Route
          </Button>
        </Box>

        {}
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FontAwesomeIcon icon={faSearch} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />

          <ToggleButtonGroup
            value={sortOption}
            exclusive
            onChange={handleSortOptionChange}
            aria-label="sort options"
          >
            <ToggleButton value="newest" aria-label="newest first">
              <FontAwesomeIcon icon={faSortDown} style={{ marginRight: 8 }} />
              Newest
            </ToggleButton>
            <ToggleButton value="oldest" aria-label="oldest first">
              <FontAwesomeIcon icon={faSortUp} style={{ marginRight: 8 }} />
              Oldest
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: "20px" }}>
            <Table sx={{ minWidth: 650 }} aria-label="routes table">
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>Sr No.</TableCell>
                  <TableCell>Route ID</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === "name"}
                      direction={
                        sortConfig.key === "name"
                          ? sortConfig.direction
                          : "desc"
                      }
                      onClick={() => handleSort("name")}
                      IconComponent={() => <FontAwesomeIcon icon={faSort} />}
                    >
                      Route Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Origin</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Waypoints</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === "status"}
                      direction={
                        sortConfig.key === "status"
                          ? sortConfig.direction
                          : "desc"
                      }
                      onClick={() => handleSort("status")}
                      IconComponent={() => <FontAwesomeIcon icon={faSort} />}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === "createdAt"}
                      direction={
                        sortConfig.key === "createdAt"
                          ? sortConfig.direction
                          : "desc"
                      }
                      onClick={() => handleSort("createdAt")}
                      IconComponent={() => <FontAwesomeIcon icon={faSort} />}
                    >
                      Created
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRoutes.map((route, index) => (
                  <TableRow
                    key={route.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">
                        {route.routeId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{route.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`Lat: ${
                          route.originCoordinates?.latitude?.toFixed(6) || "N/A"
                        }, Lng: ${
                          route.originCoordinates?.longitude?.toFixed(6) ||
                          "N/A"
                        }`}
                      >
                        <span>{route.origin}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`Lat: ${
                          route.destinationCoordinates?.latitude?.toFixed(6) ||
                          "N/A"
                        }, Lng: ${
                          route.destinationCoordinates?.longitude?.toFixed(6) ||
                          "N/A"
                        }`}
                      >
                        <span>{route.destination}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {route.waypoints?.length > 0 ? (
                        <Tooltip title={route.waypoints.join("\n")}>
                          <Chip
                            label={`${route.waypoints.length} waypoints`}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={route.status || "active"}
                        color={route.status === "active" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(route.createdAt)}</TableCell>
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
          <MenuItem onClick={handleEditClick}>
            <ListItemIcon>
              <FontAwesomeIcon icon={faEdit} fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
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
            {"Confirm Route Deletion"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to permanently delete the route{" "}
              <strong>{selectedRoute?.name}</strong>? This action cannot be
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
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          fullWidth
          maxWidth="md"
          scroll="paper"
        >
          <DialogTitle>Edit Route: {selectedRoute?.name}</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <TextField
                autoFocus
                margin="dense"
                name="name"
                label="Route Name"
                type="text"
                fullWidth
                variant="outlined"
                value={editForm.name}
                onChange={handleEditFormChange}
                sx={{ mb: 2 }}
                required
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditFormChange}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              <TextField
                margin="dense"
                name="origin"
                label="Origin Address"
                type="text"
                fullWidth
                variant="outlined"
                value={editForm.origin}
                onChange={(e) => handleAddressChange("origin", e.target.value)}
                onFocus={() => handleInputFocus("origin")}
                sx={{ mb: 2 }}
                required
              />

              <TextField
                margin="dense"
                name="destination"
                label="Destination Address"
                type="text"
                fullWidth
                variant="outlined"
                value={editForm.destination}
                onChange={(e) =>
                  handleAddressChange("destination", e.target.value)
                }
                onFocus={() => handleInputFocus("destination")}
                sx={{ mb: 2 }}
                required
              />

              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                Waypoints (Add one per line)
              </Typography>
              <TextField
                margin="dense"
                name="waypoints"
                label="Waypoints"
                type="text"
                fullWidth
                variant="outlined"
                multiline
                rows={4}
                placeholder="Address 1\nAddress 2\n..."
                value={editForm.waypoints.join("\n")}
                onChange={handleWaypointsChange}
              />
            </Box>

            <Typography variant="h6" sx={{ mb: 2 }}>
              Route Map
            </Typography>
            <Box sx={{ height: "400px", mb: 2 }}>
              <LoadScript
                googleMapsApiKey="AIzaSyByATEojq4YfKfzIIrRFA_1sAkKNKsnNeQ"
                libraries={libraries}
                onLoad={() => setMapLoaded(true)}
              >
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={originPosition || { lat: 0, lng: 0 }}
                  zoom={originPosition ? 12 : 2}
                  onClick={handleMapClick}
                  options={{
                    streetViewControl: true,
                    mapTypeControl: true,
                    fullscreenControl: true,
                    mapTypeId: "hybrid",
                    styles: [
                      {
                        featureType: "all",
                        elementType: "labels",
                        stylers: [{ visibility: "on" }],
                      },
                    ],
                  }}
                >
                  {mapLoaded && <TrafficLayer autoUpdate />}
                  {originPosition && (
                    <Marker
                      position={originPosition}
                      draggable={true}
                      onDragEnd={(e) => handleMarkerDragEnd(e, "origin")}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      }}
                    />
                  )}
                  {destinationPosition && (
                    <Marker
                      position={destinationPosition}
                      draggable={true}
                      onDragEnd={(e) => handleMarkerDragEnd(e, "destination")}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                      }}
                    />
                  )}
                </GoogleMap>
              </LoadScript>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateRoute}
              variant="contained"
              startIcon={<FontAwesomeIcon icon={faSave} />}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {!loading && filteredRoutes.length === 0 && (
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
              {searchTerm
                ? "No matching routes found"
                : "No routes found. Create your first route!"}
            </Typography>
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
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};

export default ManageRoutes;
