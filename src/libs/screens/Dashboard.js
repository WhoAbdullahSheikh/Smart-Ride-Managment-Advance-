import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  FaRoute,
  FaTruck,
  FaMapMarkerAlt,
  FaPlus,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaDirections,
  FaSave,
  FaLocationArrow,
} from "react-icons/fa";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  LoadScript,
  GoogleMap,
  DirectionsRenderer,
  Marker,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "8px",
};

const DEFAULT_CENTER = {
  lat: 39.8283,
  lng: -98.5795,
};

const libraries = ["places", "directions"];

const Dashboard = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [directions, setDirections] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [userPosition, setUserPosition] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const openMenu = Boolean(anchorEl);

  const [routeForm, setRouteForm] = useState({
    id: "",
    name: "",
    origin: "",
    destination: "",
    waypoints: [],
    status: "active",
  });

  const requestLocationPermission = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setMapCenter(pos);
          setUserPosition(pos);
          setLocationPermission(true);
          setLocationLoading(false);
        },
        (error) => {
          setLocationError(error.message);
          setLocationPermission(false);
          setLocationLoading(false);
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser");
      setLocationLoading(false);
    }
  };

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "routes"));
      const routesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRoutes(routesData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching routes: ", error);
      setSnackbar({
        open: true,
        message: "Failed to load routes",
        severity: "error",
      });
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handleMenuClick = (event, route) => {
    setAnchorEl(event.currentTarget);
    setSelectedRoute(route);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditRoute = () => {
    setEditingRoute(selectedRoute);
    setRouteForm({
      id: selectedRoute.id,
      name: selectedRoute.name,
      origin: selectedRoute.origin,
      destination: selectedRoute.destination,
      waypoints: selectedRoute.waypoints,
      status: selectedRoute.status,
    });
    setOpenDialog(true);
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
      if (directions && selectedRoute.id === directions.request.routeId) {
        setDirections(null);
      }
    } catch (error) {
      console.error("Error deleting route: ", error);
      setSnackbar({
        open: true,
        message: "Failed to delete route",
        severity: "error",
      });
    }
    handleMenuClose();
  };

  const handleAddRoute = () => {
    setEditingRoute(null);
    setRouteForm({
      id: "",
      name: "",
      origin: "",
      destination: "",
      waypoints: [],
      status: "active",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRouteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitRoute = async () => {
    try {
      if (!routeForm.name || !routeForm.origin || !routeForm.destination) {
        setSnackbar({
          open: true,
          message: "Please fill all required fields",
          severity: "warning",
        });
        return;
      }

      const routeData = {
        name: routeForm.name,
        origin: routeForm.origin,
        destination: routeForm.destination,
        waypoints: routeForm.waypoints,
        status: routeForm.status,
        updatedAt: new Date(),
      };

      if (editingRoute) {
        await updateDoc(doc(db, "routes", routeForm.id), routeData);
        setSnackbar({
          open: true,
          message: "Route updated successfully",
          severity: "success",
        });
      } else {
        routeData.createdAt = new Date();
        await addDoc(collection(db, "routes"), routeData);
        setSnackbar({
          open: true,
          message: "Route added successfully",
          severity: "success",
        });
      }

      fetchRoutes();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving route: ", error);
      setSnackbar({
        open: true,
        message: "Failed to save route",
        severity: "error",
      });
    }
  };

  const fetchDirections = useCallback(
    (route) => {
      if (!mapLoaded || !route.origin || !route.destination) return;

      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: route.origin,
          destination: route.destination,
          waypoints: route.waypoints.map((wp) => ({
            location: wp,
            stopover: true,
          })),
          travelMode: window.google.maps.TravelMode.DRIVING,
          routeId: route.id,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            setSelectedRoute(route);
          } else {
            console.error(`Error fetching directions: ${status}`);
            setSnackbar({
              open: true,
              message: "Failed to load directions",
              severity: "error",
            });
          }
        }
      );
    },
    [mapLoaded]
  );

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const centerOnUserLocation = () => {
    if (userPosition) {
      setMapCenter(userPosition);
    } else {
      requestLocationPermission();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <>
        <Typography
          variant="h4"
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            fontFamily: "Raleway-Bold, sans-serif",
          }}
        >
          Route Management <FaRoute style={{ marginLeft: "10px" }} />
        </Typography>

        {}
        {!locationPermission && (
          <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Location Access Required
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              To view your current location on the map, please grant location
              permissions.
            </Typography>
            <Button
              variant="contained"
              onClick={requestLocationPermission}
              disabled={locationLoading}
              startIcon={<FaLocationArrow />}
            >
              {locationLoading ? "Requesting..." : "Allow Location Access"}
            </Button>
            {locationError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Error: {locationError}
              </Typography>
            )}
          </Box>
        )}

        {}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 3,
            marginBottom: "30px",
          }}
        >
          <StatCard
            icon={<FaRoute />}
            title="Total Routes"
            value={routes.length}
            color="#4e73df"
          />
          <StatCard
            icon={<FaTruck />}
            title="Active Routes"
            value={routes.filter((r) => r.status === "active").length}
            color="#1cc88a"
          />
          <StatCard
            icon={<FaMapMarkerAlt />}
            title="Total Waypoints"
            value={routes.reduce(
              (acc, route) => acc + route.waypoints.length,
              0
            )}
            color="#f6c23e"
          />
          <Box
            sx={{
              background: "#0f1728",
              color: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: 1,
              borderLeft: "4px solid #36b9cc",
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <Box
              sx={{
                backgroundColor: "#36b9cc20",
                color: "#36b9cc",
                borderRadius: "50%",
                width: "50px",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              <FaPlus />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#7f8c8d",
                  fontFamily: "Raleway-Bold, sans-serif",
                }}
              >
                Manage Routes
              </Typography>
              <Button
                variant="contained"
                onClick={handleAddRoute}
                sx={{ mt: 1, width: "100%", backgroundColor: "green" }}
                startIcon={<FaPlus />}
              >
                Add Route
              </Button>
            </Box>
          </Box>
        </Box>

        {}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: 3,
            marginBottom: "30px",
          }}
        >
          {}
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: 1,
              minHeight: "500px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontFamily: "Raleway, sans-serif" }}
              >
                Saved Routes
              </Typography>
              {loading && <CircularProgress size={24} />}
            </Box>

            {routes.length === 0 && !loading ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No routes found. Create your first route to get started.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleAddRoute}
                  sx={{ mt: 2, color: "white", backgroundColor: "green" }}
                  startIcon={<FaPlus />}
                >
                  Add Route
                </Button>
              </Box>
            ) : (
              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  padding: 0,
                  maxHeight: "600px",
                  overflowY: "auto",
                  "& li": {
                    padding: "12px",
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    "&:hover": {
                      backgroundColor: "#f8f9fa",
                    },
                  },
                }}
              >
                {routes.map((route) => (
                  <li
                    key={route.id}
                    onClick={() => fetchDirections(route)}
                    style={{
                      backgroundColor:
                        selectedRoute?.id === route.id
                          ? "#e9f5ff"
                          : "transparent",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography fontWeight="bold">{route.name}</Typography>
                        <Chip
                          label={route.status}
                          size="small"
                          color={
                            route.status === "active" ? "success" : "default"
                          }
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {route.origin} → {route.destination}
                      </Typography>
                      {route.waypoints.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {route.waypoints.length} waypoint
                          {route.waypoints.length !== 1 ? "s" : ""}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, route);
                        }}
                      >
                        <FaEllipsisV />
                      </IconButton>
                    </Box>
                  </li>
                ))}
              </Box>
            )}
          </Box>

          {}
          <Box
            sx={{
              flex: 2,
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: 1,
              position: "relative",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontFamily: "Raleway, sans-serif" }}
              >
                {selectedRoute ? selectedRoute.name : "Route Visualization"}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FaLocationArrow />}
                onClick={centerOnUserLocation}
                size="small"
              >
                My Location
              </Button>
            </Box>

            <LoadScript
              googleMapsApiKey="AIzaSyByATEojq4YfKfzIIrRFA_1sAkKNKsnNeQ"
              libraries={libraries}
              onLoad={handleMapLoad}
              onError={() => {
                console.error("Google Maps failed to load");
                setSnackbar({
                  open: true,
                  message: "Failed to load Google Maps. Check your API key.",
                  severity: "error",
                });
              }}
            >
              {mapLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={locationPermission ? 12 : 5}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                >
                  {userPosition && (
                    <Marker
                      position={userPosition}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "white",
                      }}
                      title="Your Location"
                    />
                  )}
                  {directions && (
                    <DirectionsRenderer
                      directions={directions}
                      options={{
                        polylineOptions: {
                          strokeColor: "#4e73df",
                          strokeWeight: 5,
                        },
                      }}
                    />
                  )}
                </GoogleMap>
              ) : (
                <Box
                  sx={{
                    height: "500px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Loading map...</Typography>
                </Box>
              )}
            </LoadScript>

            {selectedRoute && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Route Details
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <DetailItem label="Origin" value={selectedRoute.origin} />
                  <DetailItem
                    label="Destination"
                    value={selectedRoute.destination}
                  />
                  <DetailItem
                    label="Status"
                    value={
                      <Chip
                        label={selectedRoute.status}
                        size="small"
                        color={
                          selectedRoute.status === "active"
                            ? "success"
                            : "default"
                        }
                      />
                    }
                  />
                  <DetailItem
                    label="Waypoints"
                    value={`${selectedRoute.waypoints.length} stops`}
                  />
                </Box>

                {selectedRoute.waypoints.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Waypoints:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                      {selectedRoute.waypoints.map((wp, index) => (
                        <Box
                          component="li"
                          key={`${selectedRoute.id}-wp-${index}`}
                        >
                          <Typography variant="body2">{wp}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {}
        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem
            onClick={() => {
              fetchDirections(selectedRoute);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <FaDirections />
            </ListItemIcon>
            <ListItemText>Show Directions</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleEditRoute}>
            <ListItemIcon>
              <FaEdit />
            </ListItemIcon>
            <ListItemText>Edit Route</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteRoute}>
            <ListItemIcon>
              <FaTrash />
            </ListItemIcon>
            <ListItemText>Delete Route</ListItemText>
          </MenuItem>
        </Menu>

        {}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            {editingRoute ? "Edit Route" : "Add New Route"}
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Route Name"
              type="text"
              fullWidth
              variant="outlined"
              value={routeForm.name}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              margin="dense"
              name="origin"
              label="Origin Address"
              type="text"
              fullWidth
              variant="outlined"
              value={routeForm.origin}
              onChange={handleInputChange}
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
              value={routeForm.destination}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              required
            />
            <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
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
              value={routeForm.waypoints.join("\n")}
              onChange={(e) => {
                const waypoints = e.target.value
                  .split("\n")
                  .map((wp) => wp.trim())
                  .filter((wp) => wp !== "");
                setRouteForm((prev) => ({
                  ...prev,
                  waypoints,
                }));
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button sx={{ color: "red" }} onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              sx={{ backgroundColor: "green", color: "white" }}
              onClick={handleSubmitRoute}
              variant="contained"
              startIcon={editingRoute ? <FaSave /> : <FaPlus />}
              disabled={
                !routeForm.name || !routeForm.origin || !routeForm.destination
              }
            >
              {editingRoute ? "Update Route" : "Add Route"}
            </Button>
          </DialogActions>
        </Dialog>

        {}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    </motion.div>
  );
};

const StatCard = ({ icon, title, value, color }) => (
  <Box
    sx={{
      background: "#0f1728",
      color: "#fff",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: 1,
      borderLeft: `4px solid ${color}`,
      display: "flex",
      alignItems: "center",
      gap: "15px",
    }}
  >
    <Box
      sx={{
        backgroundColor: `${color}20`,
        color: color,
        borderRadius: "50%",
        width: "50px",
        height: "50px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          color: "#7f8c8d",
          fontFamily: "Raleway-Bold, sans-serif",
        }}
      >
        {title}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: "bold" }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

const DetailItem = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    {typeof value === "string" ? (
      <Typography variant="body1">{value}</Typography>
    ) : (
      value
    )}
  </Box>
);

export default Dashboard;
