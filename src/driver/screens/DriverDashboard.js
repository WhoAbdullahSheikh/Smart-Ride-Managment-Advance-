import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  FaRoute,
  FaTruck,
  FaUser,
  FaCar,
  FaClock,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { TrafficLayer } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "12px",
};

const PAKISTAN_CENTER = {
  lat: 30.3753,
  lng: 69.3451,
};

const libraries = ["places"];

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRoute, setChatRoute] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState(PAKISTAN_CENTER);
  const [showMapLoadMessage, setShowMapLoadMessage] = useState(true);
  const [driverId, setDriverId] = useState(null);

  useEffect(() => {
    const driver = JSON.parse(sessionStorage.getItem("driver"));
    if (driver && driver.userID) {
      setDriverId(driver.userID);
    } else {
      navigate("/signin");
    }
  }, [navigate]);
  const handleOpenChat = (route) => {
    setChatRoute(route);
    setChatOpen(true);
  };
  const fetchRoutes = useCallback(async () => {
    if (!driverId) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, "routesAssigned"),
        where("assignedDriverId", "==", driverId)
      );
      const querySnapshot = await getDocs(q);
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
        message: "Failed to load assigned routes",
        severity: "error",
      });
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const handleMapLoad = () => {
    setMapLoaded(true);
    setShowMapLoadMessage(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const RouteDetails = ({ route }) => {
    if (!route) {
      return (
        <Box sx={{ textAlign: "center", p: 4 }}>
          <Typography variant="h6">No route selected</Typography>
          <Typography variant="body2" color="text.secondary">
            Please select a route to view details
          </Typography>
        </Box>
      );
    }

    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: "12px", height: "100%" }}>
        {}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography
            variant="h4"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <FaRoute style={{ marginRight: "10px" }} />
            {route.name}
          </Typography>
          <Chip
            label={route.status}
            color={route.status === "assigned" ? "success" : "default"}
          />
        </Box>

        {}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Route Information
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <DetailItem
              icon={<FaCar />}
              label="Vehicle"
              value={route.assignedVehicleInfo || "Not assigned"}
            />
            <DetailItem
              icon={<FaClock />}
              label="Assigned At"
              value={formatTime(route.assignedAt)}
            />
            <DetailItem
              icon={<FaMapMarkerAlt />}
              label="Origin"
              value={route.origin}
            />
            <DetailItem
              icon={<FaMapMarkerAlt />}
              label="Destination"
              value={route.destination}
            />
            <DetailItem
              icon={<FaClock />}
              label="Pickup Time"
              value={formatTime(route.pickupTime)}
            />
            <DetailItem
              icon={<FaClock />}
              label="Dropoff Time"
              value={formatTime(route.dropoffTime)}
            />
          </Box>
        </Box>

        {}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Coordinates
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <DetailItem
              label="Origin Coordinates"
              value={
                route.originCoordinates
                  ? `Lat: ${route.originCoordinates.latitude.toFixed(
                      6
                    )}, Lng: ${route.originCoordinates.longitude.toFixed(6)}`
                  : "N/A"
              }
            />
            <DetailItem
              label="Destination Coordinates"
              value={
                route.destinationCoordinates
                  ? `Lat: ${route.destinationCoordinates.latitude.toFixed(
                      6
                    )}, Lng: ${route.destinationCoordinates.longitude.toFixed(
                      6
                    )}`
                  : "N/A"
              }
            />
          </Box>
        </Box>

        {}
        {route.passengers?.length > 0 && (
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 1, display: "flex", alignItems: "center" }}
            >
              <FaUser style={{ marginRight: "10px" }} />
              Passengers ({route.passengers.length})
            </Typography>
            <List sx={{ bgcolor: "background.paper", borderRadius: "8px" }}>
              {route.passengers.map((passenger, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={passenger.userName}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {passenger.userEmail}
                          </Typography>
                          <br />
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            Pickup: {formatTime(passenger.pickupTime)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < route.passengers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    );
  };

  const DetailItem = ({ icon, label, value }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {icon && (
        <Box
          sx={{ color: "primary.main", display: "flex", alignItems: "center" }}
        >
          {icon}
        </Box>
      )}
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1">{value}</Typography>
      </Box>
    </Box>
  );

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box>
        {}
        <Snackbar
          open={showMapLoadMessage}
          autoHideDuration={6000}
          onClose={() => setShowMapLoadMessage(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{
            "& .MuiSnackbar-root": {
              top: "24px",
              right: "24px",
            },
          }}
        >
          <Alert
            onClose={() => setShowMapLoadMessage(false)}
            severity="info"
            sx={{ width: "100%" }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            }
          >
            If the map doesn't load properly, please refresh your page.
          </Alert>
        </Snackbar>

        <Typography
          variant="h4"
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            fontFamily: "Raleway-Bold, sans-serif",
          }}
        >
          Assigned Routes <FaRoute style={{ marginLeft: "10px" }} />
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
            marginBottom: "30px",
          }}
        >
          <StatCard
            icon={<FaRoute />}
            title="Total Assigned Routes"
            value={routes.length}
            color="#4e73df"
          />
          <StatCard
            icon={<FaTruck />}
            title="Vehicle"
            value={routes[0]?.assignedVehicleInfo || "Not assigned"}
            color="#1cc88a"
          />
          <StatCard
            icon={<FaUser />}
            title="Passengers"
            value={routes.reduce(
              (acc, route) => acc + (route.passengers?.length || 0),
              0
            )}
            color="#f6c23e"
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: 3,
            marginBottom: "30px",
          }}
        >
          {/* Left Panel - Route List */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: 1,
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
                Your Assigned Routes
              </Typography>
              {loading && <CircularProgress size={24} />}
            </Box>

            {routes.length === 0 && !loading ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No routes assigned to you yet.
                </Typography>
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
                    onClick={() => {
                      setSelectedRoute(route);
                      if (route.originCoordinates) {
                        setMapCenter({
                          lat: route.originCoordinates.latitude,
                          lng: route.originCoordinates.longitude,
                        });
                      }
                    }}
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
                            route.status === "assigned" ? "success" : "default"
                          }
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {route.origin} → {route.destination}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Pickup:</strong>{" "}
                          {formatTime(route.pickupTime)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Dropoff:</strong>{" "}
                          {formatTime(route.dropoffTime)}
                        </Typography>
                      </Box>
                      {route.passengers?.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          <strong>Passengers:</strong> {route.passengers.length}
                        </Typography>
                      )}
                    </Box>
                  </li>
                ))}
              </Box>
            )}
          </Box>

          {/* Right Panel - Map and Details */}
          <Box
            sx={{
              flex: 2,
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {/* Map Section */}
            <Box
              sx={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontFamily: "Raleway, sans-serif", mb: 2 }}
              >
                Route Map
              </Typography>
              <LoadScript
                googleMapsApiKey="AIzaSyByATEojq4YfKfzIIrRFA_1sAkKNKsnNeQ"
                libraries={libraries}
                onLoad={handleMapLoad}
                onError={() => {
                  setSnackbar({
                    open: true,
                    message: "Map failed to load. Please refresh your page.",
                    severity: "error",
                  });
                  setShowMapLoadMessage(true);
                }}
              >
                {mapLoaded ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={selectedRoute ? 12 : 6}
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

                    {routes.map((route) => {
                      if (!route.originCoordinates) return null;

                      return (
                        <Marker
                          key={route.id}
                          position={{
                            lat: route.originCoordinates.latitude,
                            lng: route.originCoordinates.longitude,
                          }}
                          title={`${route.name} (Origin)`}
                          onClick={() => {
                            setSelectedRoute(route);
                            setMapCenter({
                              lat: route.originCoordinates.latitude,
                              lng: route.originCoordinates.longitude,
                            });
                          }}
                          icon={{
                            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                          }}
                        />
                      );
                    })}

                    {selectedRoute?.originCoordinates && (
                      <Marker
                        position={{
                          lat: selectedRoute.originCoordinates.latitude,
                          lng: selectedRoute.originCoordinates.longitude,
                        }}
                        icon={{
                          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                        }}
                        title={`${selectedRoute.name} (Origin)`}
                      />
                    )}

                    {selectedRoute?.destinationCoordinates && (
                      <Marker
                        position={{
                          lat: selectedRoute.destinationCoordinates.latitude,
                          lng: selectedRoute.destinationCoordinates.longitude,
                        }}
                        icon={{
                          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                        }}
                        title={`${selectedRoute.name} (Destination)`}
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
            </Box>

            {/* Details Section */}
            <RouteDetails route={selectedRoute} />
          </Box>
        </Box>

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
      </Box>
    </motion.div>
  );
};

export default DriverDashboard;
