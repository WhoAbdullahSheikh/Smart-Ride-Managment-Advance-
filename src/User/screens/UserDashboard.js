import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";
import { FaRoute, FaTruck, FaMapMarkerAlt, FaSyncAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { db, getAuth } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
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
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [unConfirmedBookings, setUnConfirmedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState(PAKISTAN_CENTER);
  const [showMapLoadMessage, setShowMapLoadMessage] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const fetchConfirmedBookings = useCallback(async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setSnackbar({
          open: true,
          message: "Please login to view bookings",
          severity: "error",
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const bookingsQuery = query(
        collection(db, "bookings"),
        where("userEmail", "==", user.email),
        where("status", "==", "confirmed")
      );

      const querySnapshot = await getDocs(bookingsQuery);
      const bookingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      bookingsData.sort((a, b) => {
        const dateA = a.bookedAt?.seconds || 0;
        const dateB = b.bookedAt?.seconds || 0;
        return dateB - dateA;
      });

      setConfirmedBookings(bookingsData);

      if (selectedRoute) {
        const updatedRoute = bookingsData.find(
          (b) => b.id === selectedRoute.id
        );
        if (updatedRoute?.originCoordinates) {
          setMapCenter({
            lat: updatedRoute.originCoordinates.latitude,
            lng: updatedRoute.originCoordinates.longitude,
          });
        }
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching confirmed bookings: ", error);
      setSnackbar({
        open: true,
        message: "Failed to load confirmed rides",
        severity: "error",
      });
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSelectedRoute(null);
    setRefreshing(true);
    if (newValue === 0) {
      fetchConfirmedBookings();
    } else {
      fetchUnConfirmedBookings();
    }
  };
  const fetchUnConfirmedBookings = useCallback(async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setSnackbar({
          open: true,
          message: "Please login to view bookings",
          severity: "error",
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const bookingsQuery = query(
        collection(db, "bookings"),
        where("userEmail", "==", user.email),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(bookingsQuery);
      const bookingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      bookingsData.sort((a, b) => {
        const dateA = a.bookedAt?.seconds || 0;
        const dateB = b.bookedAt?.seconds || 0;
        return dateB - dateA;
      });

      setUnConfirmedBookings(bookingsData);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching unconfirmed bookings: ", error);
      setSnackbar({
        open: true,
        message: "Failed to load unconfirmed rides",
        severity: "error",
      });
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConfirmedBookings();
  }, [fetchConfirmedBookings]);

  useEffect(() => {
    fetchUnConfirmedBookings();
  }, [fetchUnConfirmedBookings]);

  const handleMapLoad = () => {
    setMapLoaded(true);
    setShowMapLoadMessage(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchConfirmedBookings(), fetchUnConfirmedBookings()]);
      if (selectedRoute) {
        const updatedRoute =
          activeTab === 0
            ? confirmedBookings.find((b) => b.id === selectedRoute.id)
            : unConfirmedBookings.find((b) => b.id === selectedRoute.id);
        setSelectedRoute(updatedRoute || null);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error refreshing data",
        severity: "error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

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

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              display: "flex",
              alignItems: "center",
              fontFamily: "Raleway-Bold, sans-serif",
            }}
          >
            My Confirmed Rides <FaRoute style={{ marginLeft: "10px" }} />
          </Typography>

          <Tooltip title="Refresh bookings">
            <IconButton
              onClick={handleRefresh}
              color="primary"
              disabled={refreshing}
            >
              <FaSyncAlt spin={refreshing} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          sx={{
            display: "grid",
            flexDirection: { xs: "column", lg: "row" },
            gridTemplateColumns: {
              xs: "2fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 3,
            marginBottom: "30px",
          }}
        >
          <StatCard
            icon={<FaRoute />}
            title="Total Confirmed Rides"
            value={confirmedBookings.length}
            color="#4e73df"
          />
          <StatCard
            icon={<FaMapMarkerAlt />}
            title="Total Unconfirmed Rides"
            value={unConfirmedBookings.length}
            color="#f6c23e"
          />
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: 3,
            marginBottom: "30px",
          }}
        >
          {/* Bookings Table */}
          <Box
            sx={{
              flex: 1,
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
              Your Confirmed Rides
            </Typography>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : confirmedBookings.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No confirmed rides found.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Route</TableCell>
                      <TableCell>Origin</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>Pickup Time</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(activeTab === 0
                      ? confirmedBookings
                      : unConfirmedBookings
                    ).map((booking) => (
                      <TableRow
                        key={booking.id}
                        hover
                        onClick={() => {
                          setSelectedRoute(booking);
                          if (booking.originCoordinates) {
                            setMapCenter({
                              lat: booking.originCoordinates.latitude,
                              lng: booking.originCoordinates.longitude,
                            });
                          }
                        }}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{booking.routeName || "N/A"}</TableCell>
                        <TableCell>{booking.origin || "N/A"}</TableCell>
                        <TableCell>{booking.destination || "N/A"}</TableCell>
                        <TableCell>{formatDate(booking.pickupTime)}</TableCell>
                        <TableCell>
                          <Chip
                            label={activeTab === 0 ? "Confirmed" : "Pending"}
                            color={activeTab === 0 ? "success" : "warning"}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {/* Map and Details Section */}
          <Box
            sx={{
              flex: 2,
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: 1,
            }}
          >
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
                  key={`map-${refreshing}`} // This forces remount on refresh
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={6}
                  options={{
                    streetViewControl: true,
                    mapTypeControl: true,
                    fullscreenControl: true,
                  }}
                >
                  {mapLoaded && <TrafficLayer autoUpdate />}

                  {selectedRoute?.originCoordinates && (
                    <Marker
                      position={{
                        lat: selectedRoute.originCoordinates.latitude,
                        lng: selectedRoute.originCoordinates.longitude,
                      }}
                      title={`${selectedRoute.routeName} (Pickup)`}
                    />
                  )}

                  {selectedRoute?.destinationCoordinates && (
                    <Marker
                      position={{
                        lat: selectedRoute.destinationCoordinates.latitude,
                        lng: selectedRoute.destinationCoordinates.longitude,
                      }}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                      }}
                      title={`${selectedRoute.routeName} (Destination)`}
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
                <Typography variant="h5" gutterBottom>
                  Ride Details
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                    mt: 2,
                  }}
                >
                  <DetailItem
                    label="Route Name"
                    value={selectedRoute.routeName}
                  />
                  <DetailItem
                    label="Status"
                    value={
                      <Chip label="Confirmed" color="success" size="small" />
                    }
                  />
                  <DetailItem label="Origin" value={selectedRoute.origin} />
                  <DetailItem
                    label="Destination"
                    value={selectedRoute.destination}
                  />
                  <DetailItem
                    label="Pickup Time"
                    value={formatDate(selectedRoute.pickupTime)}
                  />
                  <DetailItem
                    label="Booked At"
                    value={formatDate(selectedRoute.bookedAt)}
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
      width: '100%', // Ensure card fills grid cell
      height: '100%', // Uniform height
      boxSizing: 'border-box' // Include padding in width
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
        flexShrink: 0 // Prevent icon from shrinking
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}> {/* Prevent text overflow */}
      <Typography
        variant="subtitle2"
        sx={{
          color: "#7f8c8d",
          fontFamily: "Raleway-Bold, sans-serif",
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: "bold",
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
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
