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
  Tab,
  Tabs,
  Badge,
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
  faUser,
  faUsers,
  faTruck,
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
  const [assignedRoutes, setAssignedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignedLoading, setAssignedLoading] = useState(true);
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
    pickupTime: null,
    dropoffTime: null,
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
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoutes();
    fetchAssignedRoutes();
  }, []);

  const generateRouteId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `route_${timestamp}_${randomStr}`;
  };

  const fetchRoutes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "routes"));
      const routesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        routeId: doc.data().routeId || doc.id,
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

  const fetchAssignedRoutes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "routesAssigned"));
      const assignedRoutesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAssignedRoutes(assignedRoutesData);
      setAssignedLoading(false);
    } catch (error) {
      console.error("Error fetching assigned routes:", error);
      setSnackbar({
        open: true,
        message: "Failed to load assigned routes",
        severity: "error",
      });
      setAssignedLoading(false);
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

  const sortedAssignedRoutes = useMemo(() => {
    const sortableRoutes = [...assignedRoutes];
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
  }, [assignedRoutes, sortConfig]);

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

  const filteredAssignedRoutes = useMemo(() => {
    return sortedAssignedRoutes.filter((route) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        route.name.toLowerCase().includes(searchLower) ||
        route.origin.toLowerCase().includes(searchLower) ||
        route.destination.toLowerCase().includes(searchLower) ||
        route.status.toLowerCase().includes(searchLower) ||
        (route.assignedDriverName &&
          route.assignedDriverName.toLowerCase().includes(searchLower))
      );
    });
  }, [sortedAssignedRoutes, searchTerm]);

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
        pickupTime: selectedRoute.pickupTime || null,
        dropoffTime: selectedRoute.dropoffTime || null,
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
      await deleteDoc(doc(db, activeTab === 0 ? "routes" : "routesAssigned", selectedRoute.id));
      
      if (activeTab === 0) {
        setRoutes(routes.filter((route) => route.id !== selectedRoute.id));
      } else {
        setAssignedRoutes(assignedRoutes.filter((route) => route.id !== selectedRoute.id));
      }
      
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
        ...editForm,
        routeId: selectedRoute.routeId || generateRouteId(),
        pickupTime: editForm.pickupTime,
        dropoffTime: editForm.dropoffTime,
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

      await updateDoc(
        doc(db, activeTab === 0 ? "routes" : "routesAssigned", selectedRoute.id),
        routeData
      );

      if (activeTab === 0) {
        setRoutes(
          routes.map((route) =>
            route.id === selectedRoute.id ? { ...route, ...routeData } : route
          )
        );
      } else {
        setAssignedRoutes(
          assignedRoutes.map((route) =>
            route.id === selectedRoute.id ? { ...route, ...routeData } : route
          )
        );
      }

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

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatTimeForInput = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    if (isNaN(date.getTime())) return "";

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleTimeChange = (e, field) => {
    const timeString = e.target.value;
    if (!timeString) {
      setEditForm((prev) => ({ ...prev, [field]: null }));
      return;
    }

    const [hours, minutes] = timeString.split(":").map(Number);
    const newDate = new Date();
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    setEditForm((prev) => ({ ...prev, [field]: newDate }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAssignRoute = () => {
    if (selectedRoute) {
      navigate(`/dashboard/rideassign`);
    }
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

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
          variant="fullWidth"
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FontAwesomeIcon icon={faRoute} />
                <span>All Routes</span>
                {routes.length > 0 && (
                  <Chip
                    label={routes.length}
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FontAwesomeIcon icon={faUsers} />
                <span>Assigned Routes</span>
                {assignedRoutes.length > 0 && (
                  <Chip
                    label={assignedRoutes.length}
                    size="small"
                    color="secondary"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={`Search ${activeTab === 0 ? "routes" : "assigned routes"}...`}
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

        {activeTab === 0 ? (
          loading ? (
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
                    <TableCell>Pickup Time</TableCell>
                    <TableCell>Drop Time</TableCell>
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
                      <TableCell>{route.origin}</TableCell>
                      <TableCell>{route.destination}</TableCell>
                      <TableCell>
                        {route.pickupTime ? formatTime(route.pickupTime) : "N/A"}
                      </TableCell>
                      <TableCell>
                        {route.dropoffTime
                          ? formatTime(route.dropoffTime)
                          : "N/A"}
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
          )
        ) : assignedLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: "20px" }}>
            <Table sx={{ minWidth: 650 }} aria-label="assigned routes table">
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>Sr No.</TableCell>
                  <TableCell>Route Name</TableCell>
                  <TableCell>Origin</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Driver</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Passengers</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssignedRoutes.map((route, index) => (
                  <TableRow
                    key={route.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{route.name}</Typography>
                    </TableCell>
                    <TableCell>{route.origin}</TableCell>
                    <TableCell>{route.destination}</TableCell>
                    <TableCell>
                      {route.assignedDriverName || "Not assigned"}
                    </TableCell>
                    <TableCell>
                      {route.assignedVehicleInfo || "Not assigned"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        badgeContent={route.passengers?.length || 0}
                        color="primary"
                      >
                        <FontAwesomeIcon icon={faUser} />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={route.status || "assigned"}
                        color={route.status === "assigned" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {route.assignedAt
                        ? formatDate(route.assignedAt)
                        : "N/A"}
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
          {activeTab === 1 && (
            <MenuItem onClick={handleAssignRoute}>
              <ListItemIcon>
                <FontAwesomeIcon icon={faUsers} fontSize="small" />
              </ListItemIcon>
              <ListItemText>Manage Assignment</ListItemText>
            </MenuItem>
          )}
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
          <DialogTitle>
            {activeTab === 0 ? "Edit" : "View"} Route: {selectedRoute?.name}
          </DialogTitle>
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
                disabled={activeTab === 1}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditFormChange}
                  label="Status"
                  disabled={activeTab === 1}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  {activeTab === 1 && (
                    <MenuItem value="assigned">Assigned</MenuItem>
                  )}
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
                disabled={activeTab === 1}
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
                disabled={activeTab === 1}
              />

              {activeTab === 0 && (
                <>
                  <TextField
                    margin="dense"
                    name="pickupTime"
                    label="Pickup Time"
                    type="time"
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      step: 300,
                    }}
                    value={
                      editForm.pickupTime
                        ? formatTimeForInput(editForm.pickupTime)
                        : ""
                    }
                    onChange={(e) => handleTimeChange(e, "pickupTime")}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    margin="dense"
                    name="dropoffTime"
                    label="Drop Time"
                    type="time"
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      step: 300,
                    }}
                    value={
                      editForm.dropoffTime
                        ? formatTimeForInput(editForm.dropoffTime)
                        : ""
                    }
                    onChange={(e) => handleTimeChange(e, "dropoffTime")}
                    sx={{ mb: 2 }}
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
                    disabled={activeTab === 1}
                  />
                </>
              )}

              {activeTab === 1 && selectedRoute?.passengers?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Passengers</Typography>
                  <Box
                    component="ul"
                    sx={{
                      listStyle: "none",
                      padding: 0,
                      maxHeight: "150px",
                      overflowY: "auto",
                      border: "1px solid #eee",
                      borderRadius: "4px",
                      mt: 1,
                      "& li": {
                        padding: "8px 16px",
                        borderBottom: "1px solid #eee",
                        "&:last-child": {
                          borderBottom: "none",
                        },
                      },
                    }}
                  >
                    {selectedRoute.passengers.map((passenger, index) => (
                      <li key={index}>
                        <Typography>
                          {passenger.userName} ({passenger.userEmail})
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Box>
              )}
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
                  onClick={activeTab === 0 ? handleMapClick : undefined}
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
                      draggable={activeTab === 0}
                      onDragEnd={(e) => handleMarkerDragEnd(e, "origin")}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      }}
                    />
                  )}
                  {destinationPosition && (
                    <Marker
                      position={destinationPosition}
                      draggable={activeTab === 0}
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
            {activeTab === 0 && (
              <Button
                onClick={handleUpdateRoute}
                variant="contained"
                startIcon={<FontAwesomeIcon icon={faSave} />}
              >
                Save Changes
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {!loading &&
          ((activeTab === 0 && filteredRoutes.length === 0) ||
            (activeTab === 1 && filteredAssignedRoutes.length === 0)) && (
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
                  ? `No matching ${
                      activeTab === 0 ? "routes" : "assigned routes"
                    } found`
                  : activeTab === 0
                  ? "No routes found. Create your first route!"
                  : "No routes have been assigned yet"}
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