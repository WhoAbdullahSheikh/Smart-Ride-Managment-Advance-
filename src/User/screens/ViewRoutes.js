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
  Button,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  query,
  where,
} from "firebase/firestore";
import { db, getAuth } from "../firebase";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faClock,
  faArrowRight,
  faSyncAlt,
} from "@fortawesome/free-solid-svg-icons";

const ViewRoutes = () => {
  const [allRoutes, setAllRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userBookedRoutes, setUserBookedRoutes] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const fetchRoutes = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      // Fetch all routes
      const routesQuery = await getDocs(collection(db, "routes"));
      const routesData = routesQuery.docs.map((doc) => ({
        id: doc.id,
        routeId: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamps to Date objects if they exist
        pickupTime: doc.data().pickupTime?.toDate() || null,
        dropoffTime: doc.data().dropoffTime?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || null,
        status: doc.data().status?.toLowerCase() || "active",
      }));
      setAllRoutes(routesData);

      if (user) {
        // Query bookings collection for this user's bookings
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("userEmail", "==", user.email)
        );
        const querySnapshot = await getDocs(bookingsQuery);

        const bookedRoutes = querySnapshot.docs.map((doc) => ({
          routeId: doc.data().routeId,
          userEmail: doc.data().userEmail,
        }));

        setUserBookedRoutes(bookedRoutes);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSnackbar({
        open: true,
        message: "Failed to load routes",
        severity: "error",
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRoutes();
  };

  // Filter out routes that are rejected or user has already booked
  const availableRoutes = allRoutes.filter((route) => {
    const auth = getAuth();
    const user = auth.currentUser;

    // Hide rejected routes
    if (route.status === "rejected") return false;

    // Show only active, approved, or cancelled routes
    const isRouteVisible = ["active", "approved", "cancelled"].includes(
      route.status
    );
    if (!isRouteVisible) return false;

    if (!user) return true; // Show all visible routes if not logged in

    return !userBookedRoutes.some(
      (booking) =>
        (booking.routeId === route.id || booking.routeId === route.routeId) &&
        booking.userEmail === user.email
    );
  });

  const handleBookRide = async (route) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setSnackbar({
          open: true,
          message: "You must be logged in to book a ride",
          severity: "error",
        });
        return;
      }

      const routeIdentifier = route.id || route.routeId;

      // Check if user has already booked this route
      const alreadyBooked = userBookedRoutes.some(
        (booking) =>
          booking.routeId === routeIdentifier &&
          booking.userEmail === user.email
      );

      if (alreadyBooked) {
        setSnackbar({
          open: true,
          message: "You have already booked this route",
          severity: "warning",
        });
        return;
      }

      // Don't allow booking if route is not active/approved/cancelled
      if (!["active", "approved", "cancelled"].includes(route.status)) {
        setSnackbar({
          open: true,
          message: "This route is not available for booking",
          severity: "error",
        });
        return;
      }

      const bookingData = {
        routeId: routeIdentifier,
        routeName: route.name,
        origin: route.origin,
        destination: route.destination,
        pickupTime: route.pickupTime,
        dropoffTime: route.dropoffTime,
        bookedAt: new Date(),
        status: "pending",
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || "User",
      };

      // 1. Add to bookings collection
      const bookingRef = await addDoc(collection(db, "bookings"), bookingData);

      // 2. Update user document in both collections
      const updateUserBooking = async (collectionName) => {
        const usersQuery = query(
          collection(db, collectionName),
          where("userData.email", "==", user.email)
        );
        const querySnapshot = await getDocs(usersQuery);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, collectionName, userDoc.id), {
            bookings: arrayUnion({
              bookingId: bookingRef.id,
              ...bookingData,
            }),
            updatedAt: new Date(),
          });
          return true;
        }
        return false;
      };

      // Try updating in both collections
      const updatedInGoogle = await updateUserBooking("google");
      const updatedInEmail = !updatedInGoogle
        ? await updateUserBooking("email")
        : false;

      // Update local state to reflect the new booking
      setUserBookedRoutes([
        ...userBookedRoutes,
        {
          routeId: routeIdentifier,
          userEmail: user.email,
        },
      ]);

      setSnackbar({
        open: true,
        message: `Ride booked successfully for ${route.name}`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error booking ride:", error);
      setSnackbar({
        open: true,
        message: `Failed to book ride: ${error.message}`,
        severity: "error",
      });
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (date) => {
    if (!date) return "N/A";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <Typography variant="h4" component="h1" gutterBottom>
            Available Routes
          </Typography>
          <Tooltip title="Refresh routes">
            
            <IconButton
              onClick={handleRefresh}
              color="primary"
              disabled={refreshing}
            >
              <FontAwesomeIcon icon={faSyncAlt} spin={refreshing} />
              <Button
                onClick={handleRefresh}
                color="primary"
                disabled={refreshing}
              >
                Refresh
              </Button>
            </IconButton>
          </Tooltip>
        </Box>

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
                  <TableCell>Schedule</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {availableRoutes.map((route) => (
                  <TableRow
                    key={route.id || route.routeId}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell>{route.name}</TableCell>
                    <TableCell>{route.origin}</TableCell>
                    <TableCell>{route.destination}</TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <FontAwesomeIcon icon={faClock} />
                        <Typography variant="body2">
                          {formatTime(route.pickupTime)}
                        </Typography>
                        <FontAwesomeIcon icon={faArrowRight} />
                        <Typography variant="body2">
                          {formatTime(route.dropoffTime)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(route.pickupTime)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDateTime(route.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        label={route.status}
                        color={
                          route.status === "active"
                            ? "success"
                            : route.status === "approved"
                            ? "primary"
                            : route.status === "cancelled"
                            ? "warning"
                            : "error"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleBookRide(route)}
                        startIcon={<FontAwesomeIcon icon={faCar} />}
                        disabled={
                          !["active", "approved", "cancelled"].includes(
                            route.status
                          ) ||
                          userBookedRoutes.some(
                            (booking) =>
                              (booking.routeId === route.id ||
                                booking.routeId === route.routeId) &&
                              booking.userEmail === getAuth().currentUser?.email
                          )
                        }
                      >
                        Book Ride
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && availableRoutes.length === 0 && (
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
            <Box component="p" sx={{ color: "text.secondary" }}>
              {getAuth().currentUser
                ? "No available routes or you've booked all routes"
                : "No routes available"}
            </Box>
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
