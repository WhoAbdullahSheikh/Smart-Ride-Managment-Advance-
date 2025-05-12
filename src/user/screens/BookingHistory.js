import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db, getAuth } from "../firebase";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCheckCircle,
  faTimesCircle,
  faTrash,
  faSyncAlt,
} from "@fortawesome/free-solid-svg-icons";

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    bookingId: null,
  });
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      sessionStorage.setItem("isHardRefresh", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    const isHardRefresh = sessionStorage.getItem("isHardRefresh") === "true";
    sessionStorage.removeItem("isHardRefresh");

    if (isHardRefresh) {
      navigate("/userdashboard");
      return;
    }

    fetchBookings();

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [navigate]);

  useEffect(() => {
    // Filter bookings based on active tab
    const filterBookings = () => {
      switch (activeTab) {
        case 0: // Pending
          return bookings.filter(
            (booking) => booking.status?.toLowerCase() === "pending"
          );
        case 1: // Approved
          return bookings.filter(
            (booking) => booking.status?.toLowerCase() === "confirmed"
          );
        case 2: // Rejected
          return bookings.filter(
            (booking) => booking.status?.toLowerCase() === "rejected"
          );
        default:
          return bookings;
      }
    };
    setFilteredBookings(filterBookings());
  }, [activeTab, bookings]);

  const fetchBookings = async () => {
    try {
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

      // Fetch bookings from the bookings collection where userEmail matches
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("userEmail", "==", user.email)
      );
      const querySnapshot = await getDocs(bookingsQuery);

      const bookingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by booking date (newest first)
      bookingsData.sort((a, b) => {
        const dateA = a.bookedAt?.seconds || 0;
        const dateB = b.bookedAt?.seconds || 0;
        return dateB - dateA;
      });

      setBookings(bookingsData);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setSnackbar({
        open: true,
        message: "Failed to load booking history",
        severity: "error",
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCancelClick = (bookingId) => {
    setCancelDialog({
      open: true,
      bookingId: bookingId,
    });
  };

  const handleCancelConfirm = async () => {
    try {
      const { bookingId } = cancelDialog;

      if (!bookingId) {
        setSnackbar({
          open: true,
          message: "No booking selected",
          severity: "error",
        });
        return;
      }

      setLoading(true);

      // Delete the booking document
      await deleteDoc(doc(db, "bookings", bookingId));

      setSnackbar({
        open: true,
        message: "Booking cancelled successfully",
        severity: "success",
      });

      // Refresh the bookings list
      await fetchBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      setSnackbar({
        open: true,
        message: "Failed to cancel booking",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setCancelDialog({ open: false, bookingId: null });
    }
  };

  const handleCancelClose = () => {
    setCancelDialog({ open: false, bookingId: null });
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

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <FontAwesomeIcon icon={faClock} color="orange" />;
      case "confirmed":
        return <FontAwesomeIcon icon={faCheckCircle} color="green" />;
      case "rejected":
        return <FontAwesomeIcon icon={faTimesCircle} color="red" />;
      default:
        return <FontAwesomeIcon icon={faClock} color="gray" />;
    }
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
            My Ride Bookings
          </Typography>
          <Tooltip title="Refresh bookings">
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

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Pending" />
            <Tab label="Approved" />
            <Tab label="Rejected" />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="bookings table">
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>Route</TableCell>
                  <TableCell>Origin</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Booked At</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking) => (
                    <TableRow
                      key={booking.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell>{booking.routeName || "N/A"}</TableCell>
                      <TableCell>{booking.origin || "N/A"}</TableCell>
                      <TableCell>{booking.destination || "N/A"}</TableCell>
                      <TableCell>{formatDate(booking.bookedAt)}</TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {getStatusIcon(booking.status)}
                          <Chip
                            label={booking.status || "pending"}
                            color={
                              booking.status === "confirmed"
                                ? "success"
                                : booking.status === "rejected"
                                ? "error"
                                : "warning"
                            }
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {booking.status === "pending" && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleCancelClick(booking.id)}
                            sx={{ mr: 1 }}
                          >
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center" }}>
                      No{" "}
                      {activeTab === 0
                        ? "pending"
                        : activeTab === 1
                        ? "approved"
                        : "rejected"}{" "}
                      bookings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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

        <Dialog
          open={cancelDialog.open}
          onClose={handleCancelClose}
          aria-labelledby="cancel-dialog-title"
        >
          <DialogTitle id="cancel-dialog-title">
            Confirm Cancellation
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to cancel this booking? This action cannot
              be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelClose}>No</Button>
            <Button
              onClick={handleCancelConfirm}
              color="error"
              autoFocus
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Yes, Cancel"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
};

export default BookingHistory;
