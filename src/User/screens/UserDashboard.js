import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import { FaRoute, FaTruck, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { TrafficLayer } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "700px",
  borderRadius: "30px",
};

const PAKISTAN_CENTER = {
  lat: 30.3753,
  lng: 69.3451,
};

const libraries = ["places"];

const UserDashboard = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState(PAKISTAN_CENTER);
  const [showMapLoadMessage, setShowMapLoadMessage] = useState(true);

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

  const handleMapLoad = () => {
    setMapLoaded(true);
    setShowMapLoadMessage(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box>
        {/* Map load alert */}
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
          Route Information <FaRoute style={{ marginLeft: "10px" }} />
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
              (acc, route) => acc + (route.waypoints?.length || 0),
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
                Available Routes
              </Typography>
              {loading && <CircularProgress size={24} />}
            </Box>

            {routes.length === 0 && !loading ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No routes available.
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
                    onClick={() => setSelectedRoute(route)}
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
                      {route.waypoints?.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {route.waypoints.length} waypoint
                          {route.waypoints.length !== 1 ? "s" : ""}
                        </Typography>
                      )}
                    </Box>
                  </li>
                ))}
              </Box>
            )}
          </Box>

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
                {selectedRoute
                  ? `${selectedRoute.name} Origin`
                  : "Route Origins"}
              </Typography>
            </Box>

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
                  zoom={6}
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
                        onClick={() => setSelectedRoute(route)}
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
                      title={`${selectedRoute.name} (Selected Origin)`}
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
                <Typography variant="h4" gutterBottom>
                  Route Details
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <DetailItem label="Route Name" value={selectedRoute.name} />
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
                        sx={{
                          marginLeft: 2,
                        }}
                      />
                    }
                  />
                  <DetailItem label="Origin" value={selectedRoute.origin} />
                  <DetailItem
                    label="Destination"
                    value={selectedRoute.destination}
                  />
                  <DetailItem
                    label="Origin Coordinates"
                    value={
                      selectedRoute.originCoordinates
                        ? `Latitude: ${selectedRoute.originCoordinates.latitude?.toFixed(
                            6
                          )}, Longitude: ${selectedRoute.originCoordinates.longitude?.toFixed(
                            6
                          )}`
                        : "Not available"
                    }
                  />
                  <DetailItem
                    label="Destination Coordinates"
                    value={
                      selectedRoute.destinationCoordinates
                        ? `Latitude: ${selectedRoute.destinationCoordinates.latitude?.toFixed(
                            6
                          )}, Longitude: ${selectedRoute.destinationCoordinates.longitude?.toFixed(
                            6
                          )}`
                        : "Not available"
                    }
                  />
                  <DetailItem
                    label="Waypoints"
                    value={`${selectedRoute.waypoints?.length || 0} stops`}
                  />
                </Box>
              </Box>
            )}
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

export default UserDashboard;