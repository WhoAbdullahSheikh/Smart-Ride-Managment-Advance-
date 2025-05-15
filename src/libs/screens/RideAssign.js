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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Badge,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
} from "@mui/material";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  writeBatch,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCheckCircle,
  faTimesCircle,
  faSyncAlt,
  faRoute,
  faUsers,
  faCheckDouble,
  faFilter,
  faSearch,
  faArrowLeft,
  faFileExport,
  faSort,
  faUser,
  faCar,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Tab, Tabs } from "@mui/material";

const RideAssign = () => {
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [assignedRoutes, setAssignedRoutes] = useState([]);
  const [groupedBookings, setGroupedBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [actionDialog, setActionDialog] = useState({
    open: false,
    bookingId: null,
    action: null,
  });
  const [confirmAllDialog, setConfirmAllDialog] = useState({
    open: false,
    routeId: null,
  });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null,
  });
  const [sortConfig, setSortConfig] = useState({
    key: "bookedAt",
    direction: "desc",
  });
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignmentDialog, setAssignmentDialog] = useState({
    open: false,
    routeId: null,
    driverId: null,
    vehicleId: null,
  });

  useEffect(() => {
    fetchBookings();
    fetchDrivers();
    fetchVehicles();
    fetchAssignedRoutes();
  }, []);

  useEffect(() => {
    const filtered = bookings
      .filter((booking) => {
        const matchesStatus =
          booking.status?.toLowerCase() === statusFilter.toLowerCase();
        const matchesSearch =
          booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.routeName?.toLowerCase().includes(searchTerm.toLowerCase());

        const bookingDate = booking.bookedAt?.toDate() || new Date(0);
        const matchesDateRange =
          (!dateRange.start || bookingDate >= dateRange.start) &&
          (!dateRange.end || bookingDate <= dateRange.end);

        return matchesStatus && matchesSearch && matchesDateRange;
      })
      .sort((a, b) => {
        if (sortConfig.key === "bookedAt") {
          const dateA = a.bookedAt?.seconds || 0;
          const dateB = b.bookedAt?.seconds || 0;
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (sortConfig.key === "pickupTime") {
          const dateA = a.pickupTime?.seconds || 0;
          const dateB = b.pickupTime?.seconds || 0;
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (sortConfig.key === "userName") {
          const nameA = a.userName || "";
          const nameB = b.userName || "";
          return sortConfig.direction === "asc"
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        }
        return 0;
      });

    setPendingBookings(filtered);

    const grouped = filtered.reduce((acc, booking) => {
      if (!booking.routeId) return acc;
      if (!acc[booking.routeId]) {
        acc[booking.routeId] = {
          count: 0,
          bookings: [],
          routeName: booking.routeName,
          origin: booking.origin,
          destination: booking.destination,
          pickupTime: booking.pickupTime,
          dropoffTime: booking.dropoffTime,
        };
      }
      acc[booking.routeId].count++;
      acc[booking.routeId].bookings.push(booking);
      return acc;
    }, {});

    setGroupedBookings(grouped);
  }, [bookings, searchTerm, statusFilter, dateRange, sortConfig]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(bookingsQuery);

      const bookingsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setSnackbar({
        open: true,
        message: "Failed to load bookings",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAssignedRoutes = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "routesAssigned"));
      const routesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAssignedRoutes(routesData);
    } catch (error) {
      console.error("Error fetching assigned routes:", error);
      setSnackbar({
        open: true,
        message: "Failed to load assigned routes",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "drivers"));
      const driversData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().userData?.name || "Unnamed Driver",
      }));
      setDrivers(driversData);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "vehicles"));
      const vehiclesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const fetchRouteDetails = async (routeId, isAssigned = false) => {
    try {
      if (!routeId) return;

      const collectionName = isAssigned ? "routesAssigned" : "routes";
      const routeDoc = await getDoc(doc(db, collectionName, routeId));

      if (routeDoc.exists()) {
        const routeData = routeDoc.data();

        const assignedDriver = drivers.find(
          (driver) => driver.id === routeData.assignedDriverId
        );

        const assignedVehicle = vehicles.find(
          (vehicle) => vehicle.id === routeData.assignedVehicleId
        );

        setRouteDetails({
          id: routeDoc.id,
          ...routeData,
          assignedDriverName: assignedDriver?.name || "Not assigned",
          assignedVehicleInfo: assignedVehicle
            ? `${assignedVehicle.make} ${assignedVehicle.model} (${assignedVehicle.plateNumber})`
            : "Not assigned",
          passengerCount: isAssigned
            ? routeData.passengers?.length || 0
            : routeData.bookings?.length || 0,
          isAssigned,
        });
      } else {
        setRouteDetails(null);
      }
    } catch (error) {
      console.error("Error fetching route details:", error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
    fetchDrivers();
    fetchVehicles();
    fetchAssignedRoutes();
  };

  const handleActionClick = (bookingId, action) => {
    setActionDialog({
      open: true,
      bookingId: bookingId,
      action: action,
    });
  };

  const handleActionConfirm = async () => {
    try {
      const { bookingId, action } = actionDialog;

      if (!bookingId || !action) {
        setSnackbar({
          open: true,
          message: "No booking selected",
          severity: "error",
        });
        return;
      }

      setLoading(true);
      await updateDoc(doc(db, "bookings", bookingId), {
        status: action === "confirm" ? "confirmed" : "rejected",
      });

      setSnackbar({
        open: true,
        message: `Booking ${
          action === "confirm" ? "confirmed" : "rejected"
        } successfully`,
        severity: "success",
      });

      await fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      setSnackbar({
        open: true,
        message: `Failed to ${actionDialog.action} booking`,
        severity: "error",
      });
    } finally {
      setLoading(false);
      setActionDialog({ open: false, bookingId: null, action: null });
    }
  };

  const handleConfirmAll = (routeId) => {
    setConfirmAllDialog({
      open: true,
      routeId: routeId,
    });
  };

  const handleConfirmAllConfirm = async () => {
    try {
      const { routeId } = confirmAllDialog;
      if (!routeId || !groupedBookings[routeId]) {
        setSnackbar({
          open: true,
          message: "No route selected",
          severity: "error",
        });
        return;
      }

      setLoading(true);
      const batch = writeBatch(db);
      const bookingsToUpdate = groupedBookings[routeId].bookings;

      bookingsToUpdate.forEach((booking) => {
        const bookingRef = doc(db, "bookings", booking.id);
        batch.update(bookingRef, { status: "confirmed" });
      });

      await batch.commit();

      setSnackbar({
        open: true,
        message: `All ${bookingsToUpdate.length} bookings confirmed successfully`,
        severity: "success",
      });

      await fetchBookings();
    } catch (error) {
      console.error("Error confirming all bookings:", error);
      setSnackbar({
        open: true,
        message: "Failed to confirm all bookings",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setConfirmAllDialog({ open: false, routeId: null });
    }
  };

  const handleAssignDriverAndVehicle = async () => {
    try {
      const { routeId, driverId, vehicleId } = assignmentDialog;

      if (!routeId || !driverId || !vehicleId) {
        setSnackbar({
          open: true,
          message: "Please select both driver and vehicle",
          severity: "error",
        });
        return;
      }

      setLoading(true);

      const routeDoc = await getDoc(doc(db, "routes", routeId));
      if (!routeDoc.exists()) {
        throw new Error("Route not found");
      }

      const routeData = routeDoc.data();
      const driver = drivers.find((d) => d.id === driverId);
      const vehicle = vehicles.find((v) => v.id === vehicleId);

      if (!driver || !vehicle) {
        throw new Error("Driver or vehicle not found");
      }

      const bookingsQuery = query(
        collection(db, "bookings"),
        where("routeId", "==", routeId)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const routeBookings = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const assignedRouteData = {
        ...routeData,
        assignedDriverId: driverId,
        assignedDriverName: driver.name,
        assignedVehicleId: vehicleId,
        assignedVehicleInfo: `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`,
        passengers: routeBookings.map((booking) => ({
          userId: booking.userId,
          userName: booking.userName,
          userEmail: booking.userEmail,
        })),
        assignedAt: new Date(),
        status: "assigned",
      };

      await addDoc(collection(db, "routesAssigned"), assignedRouteData);

      const batch = writeBatch(db);
      routeBookings.forEach((booking) => {
        const bookingRef = doc(db, "bookings", booking.id);
        batch.update(bookingRef, {
          status: "confirmed",
          assignedDriverId: driverId,
          assignedVehicleId: vehicleId,
        });
      });

      await deleteDoc(doc(db, "routes", routeId));

      await batch.commit();

      setSnackbar({
        open: true,
        message: `Successfully assigned driver and vehicle to route and confirmed ${routeBookings.length} bookings`,
        severity: "success",
      });

      await fetchBookings();
      await fetchAssignedRoutes();
      setSelectedRoute(null);
    } catch (error) {
      console.error("Error assigning driver and vehicle:", error);
      setSnackbar({
        open: true,
        message: "Failed to assign driver and vehicle",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setAssignmentDialog({
        open: false,
        routeId: null,
        driverId: null,
        vehicleId: null,
      });
    }
  };

  const handleUnassignRoute = async (routeId) => {
    try {
      setLoading(true);

      const routeDoc = await getDoc(doc(db, "routesAssigned", routeId));
      if (!routeDoc.exists()) {
        throw new Error("Route not found");
      }

      const routeData = routeDoc.data();

      await addDoc(collection(db, "routes"), {
        ...routeData,
        status: "pending",
        assignedDriverId: null,
        assignedDriverName: null,
        assignedVehicleId: null,
        assignedVehicleInfo: null,
        passengers: [],
        assignedAt: null,
      });

      const batch = writeBatch(db);
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("routeId", "==", routeId)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);

      bookingsSnapshot.docs.forEach((doc) => {
        const bookingRef = doc.ref;
        batch.update(bookingRef, {
          status: "pending",
          assignedDriverId: null,
          assignedVehicleId: null,
        });
      });

      await deleteDoc(doc(db, "routesAssigned", routeId));

      await batch.commit();

      setSnackbar({
        open: true,
        message: "Route unassigned successfully",
        severity: "success",
      });

      await fetchBookings();
      await fetchAssignedRoutes();
      setSelectedRoute(null);
    } catch (error) {
      console.error("Error unassigning route:", error);
      setSnackbar({
        open: true,
        message: "Failed to unassign route",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleDateRangeChange = (type, date) => {
    setDateRange((prev) => ({ ...prev, [type]: date }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("pending");
    setDateRange({ start: null, end: null });
    setFilterDialogOpen(false);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleActionClose = () => {
    setActionDialog({ open: false, bookingId: null, action: null });
  };

  const handleConfirmAllClose = () => {
    setConfirmAllDialog({ open: false, routeId: null });
  };

  const handleAssignmentClose = () => {
    setAssignmentDialog({ ...assignmentDialog, open: false });
  };

  const handleRouteSelect = (routeId, isAssigned = false) => {
    setSelectedRoute(routeId);
    fetchRouteDetails(routeId, isAssigned);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return (
      <FontAwesomeIcon
        icon={faSort}
        rotation={sortConfig.direction === "asc" ? 180 : undefined}
        style={{ marginLeft: 5 }}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: 3 }}>
        {}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {selectedRoute && (
              <IconButton onClick={() => setSelectedRoute(null)}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </IconButton>
            )}
            <Typography variant="h4" component="h1">
              Route Ride Management
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faSearch} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />

            <Button
              variant="outlined"
              startIcon={<FontAwesomeIcon icon={faFilter} />}
              onClick={() => setFilterDialogOpen(true)}
            >
              Filters
            </Button>

            <Tooltip title="Refresh data">
              <IconButton
                onClick={handleRefresh}
                color="primary"
                disabled={refreshing}
              >
                <FontAwesomeIcon icon={faSyncAlt} spin={refreshing} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {}
        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Filter Bookings</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3, mt: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Date Range
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <TextField
                  type="date"
                  label="Start Date"
                  value={
                    dateRange.start
                      ? dateRange.start.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleDateRangeChange("start", new Date(e.target.value))
                  }
                  size="small"
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <span>to</span>
                <TextField
                  type="date"
                  label="End Date"
                  value={
                    dateRange.end
                      ? dateRange.end.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleDateRangeChange("end", new Date(e.target.value))
                  }
                  size="small"
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClearFilters}>Clear All</Button>
            <Button
              onClick={() => setFilterDialogOpen(false)}
              color="primary"
              variant="contained"
            >
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>

        {}
        {!selectedRoute && (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total {activeTab === "pending" ? "Pending" : "Assigned"}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {activeTab === "pending"
                        ? Object.values(groupedBookings).reduce(
                            (sum, route) => sum + route.count,
                            0
                          )
                        : assignedRoutes.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      {activeTab === "pending" ? "Pending" : "Assigned"} Routes
                    </Typography>
                    <Typography variant="h4" component="div">
                      {activeTab === "pending"
                        ? Object.keys(groupedBookings).length
                        : assignedRoutes.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Earliest Pickup
                    </Typography>
                    <Typography variant="h6" component="div">
                      {activeTab === "pending"
                        ? Object.values(groupedBookings).length > 0
                          ? formatDate(
                              new Date(
                                Math.min(
                                  ...Object.values(groupedBookings).map(
                                    (route) =>
                                      route.pickupTime?.seconds
                                        ? route.pickupTime.toDate().getTime()
                                        : Date.now()
                                  )
                                )
                              )
                            )
                          : "N/A"
                        : assignedRoutes.length > 0
                        ? formatDate(
                            new Date(
                              Math.min(
                                ...assignedRoutes.map((route) =>
                                  route.pickupTime?.seconds
                                    ? route.pickupTime.toDate().getTime()
                                    : Date.now()
                                )
                              )
                            )
                          )
                        : "N/A"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Latest Pickup
                    </Typography>
                    <Typography variant="h6" component="div">
                      {activeTab === "pending"
                        ? Object.values(groupedBookings).length > 0
                          ? formatDate(
                              new Date(
                                Math.max(
                                  ...Object.values(groupedBookings).map(
                                    (route) =>
                                      route.pickupTime?.seconds
                                        ? route.pickupTime.toDate().getTime()
                                        : 0
                                  )
                                )
                              )
                            )
                          : "N/A"
                        : assignedRoutes.length > 0
                        ? formatDate(
                            new Date(
                              Math.max(
                                ...assignedRoutes.map((route) =>
                                  route.pickupTime?.seconds
                                    ? route.pickupTime.toDate().getTime()
                                    : 0
                                )
                              )
                            )
                          )
                        : "N/A"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label="Pending Routes" value="pending" />
            <Tab label="Assigned Routes" value="assigned" />
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={selectedRoute ? 12 : 12}>
            {!selectedRoute ? (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <FontAwesomeIcon
                      icon={faRoute}
                      style={{ marginRight: 8 }}
                    />
                    {activeTab === "pending" ? "Pending" : "Assigned"} Bookings
                    by Route
                  </Typography>
                  {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <CircularProgress />
                    </Box>
                  ) : activeTab === "pending" ? (
                    Object.keys(groupedBookings).length > 0 ? (
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Route</TableCell>
                              <TableCell>Origin → Destination</TableCell>
                              <TableCell>Pickup Time</TableCell>
                              <TableCell>Bookings</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(groupedBookings).map(
                              ([routeId, routeData]) => (
                                <TableRow
                                  key={routeId}
                                  hover
                                  selected={selectedRoute === routeId}
                                  onClick={() => handleRouteSelect(routeId)}
                                  sx={{ cursor: "pointer" }}
                                >
                                  <TableCell>
                                    {routeData.routeName || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {routeData.origin} → {routeData.destination}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(routeData.pickupTime)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      badgeContent={routeData.count}
                                      color="primary"
                                    >
                                      <FontAwesomeIcon icon={faUsers} />
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRouteSelect(routeId);
                                      }}
                                    >
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body1" color="textSecondary">
                        No pending bookings by route found
                      </Typography>
                    )
                  ) : assignedRoutes.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Route</TableCell>
                            <TableCell>Origin → Destination</TableCell>
                            <TableCell>Driver</TableCell>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>Pickup Time</TableCell>
                            <TableCell>Passengers</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {assignedRoutes.map((route) => (
                            <TableRow
                              key={route.id}
                              hover
                              selected={selectedRoute === route.id}
                              onClick={() => handleRouteSelect(route.id, true)}
                              sx={{ cursor: "pointer" }}
                            >
                              <TableCell>{route.name || "N/A"}</TableCell>
                              <TableCell>
                                {route.origin} → {route.destination}
                              </TableCell>
                              <TableCell>
                                {route.assignedDriverName || "Not assigned"}
                              </TableCell>
                              <TableCell>
                                {route.assignedVehicleInfo || "Not assigned"}
                              </TableCell>
                              <TableCell>
                                {formatDate(route.pickupTime)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  badgeContent={route.passengers?.length || 0}
                                  color="primary"
                                >
                                  <FontAwesomeIcon icon={faUsers} />
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRouteSelect(route.id, true);
                                  }}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body1" color="textSecondary">
                      No assigned routes found
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {routeDetails && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            <FontAwesomeIcon
                              icon={faRoute}
                              style={{ marginRight: 8 }}
                            />
                            Route Details
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1">
                              {routeDetails.name || "Unnamed Route"}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              ID: {routeDetails.id}
                            </Typography>
                          </Box>

                          {}
                          <Box
                            sx={{
                              mb: 3,
                              p: 2,
                              backgroundColor: "#f8f9fa",
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              gutterBottom
                              sx={{ display: "flex", alignItems: "center" }}
                            >
                              <FontAwesomeIcon
                                icon={faUser}
                                style={{ marginRight: 8 }}
                              />
                              Driver & Vehicle Assignment
                            </Typography>

                            {routeDetails.assignedDriverId &&
                            routeDetails.assignedVehicleId ? (
                              <Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 1,
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={faUser}
                                    style={{ marginRight: 8, color: "#555" }}
                                  />
                                  <Typography>
                                    <strong>Driver:</strong>{" "}
                                    {routeDetails.assignedDriverName}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <FontAwesomeIcon
                                    icon={faCar}
                                    style={{ marginRight: 8, color: "#555" }}
                                  />
                                  <Typography>
                                    <strong>Vehicle:</strong>{" "}
                                    {routeDetails.assignedVehicleInfo}
                                  </Typography>
                                </Box>
                                {!routeDetails.isAssigned && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 2 }}
                                    onClick={() =>
                                      setAssignmentDialog({
                                        open: true,
                                        routeId: selectedRoute,
                                        driverId: routeDetails.assignedDriverId,
                                        vehicleId:
                                          routeDetails.assignedVehicleId,
                                      })
                                    }
                                  >
                                    Change Assignment
                                  </Button>
                                )}
                              </Box>
                            ) : (
                              <Box sx={{ textAlign: "center" }}>
                                <Typography
                                  color="textSecondary"
                                  sx={{ mb: 1 }}
                                >
                                  No driver and vehicle assigned
                                </Typography>
                                {!routeDetails.isAssigned && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() =>
                                      setAssignmentDialog({
                                        open: true,
                                        routeId: selectedRoute,
                                        driverId: null,
                                        vehicleId: null,
                                      })
                                    }
                                    startIcon={
                                      <FontAwesomeIcon icon={faCheckCircle} />
                                    }
                                  >
                                    Assign Now
                                  </Button>
                                )}
                              </Box>
                            )}
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Origin:</strong> {routeDetails.origin}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Destination:</strong>{" "}
                                {routeDetails.destination}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Pickup Time:</strong>{" "}
                                {formatDate(routeDetails.pickupTime)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2">
                                <strong>Dropoff Time:</strong>{" "}
                                {formatDate(routeDetails.dropoffTime)}
                              </Typography>
                            </Grid>
                            
                            {routeDetails.isAssigned && (
                              <>
                                <Grid item xs={6}>
                                  <Typography variant="body2">
                                    <strong>Assigned At:</strong>{" "}
                                    {formatDate(routeDetails.assignedAt)}
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2">
                                    <strong>Status:</strong>{" "}
                                    <Chip
                                      label={
                                        routeDetails.status
                                          ?.charAt(0)
                                          .toUpperCase() +
                                        routeDetails.status?.slice(1)
                                      }
                                      color={
                                        routeDetails.status === "assigned"
                                          ? "success"
                                          : "default"
                                      }
                                      size="small"
                                    />
                                  </Typography>
                                </Grid>
                              </>
                            )}
                          </Grid>

                          {routeDetails.isAssigned && (
                            <Box sx={{ mt: 3 }}>
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<FontAwesomeIcon icon={faTrash} />}
                                onClick={() =>
                                  handleUnassignRoute(routeDetails.id)
                                }
                                fullWidth
                              >
                                Unassign Route
                              </Button>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            <FontAwesomeIcon
                              icon={faUsers}
                              style={{ marginRight: 8 }}
                            />
                            {routeDetails.isAssigned
                              ? "Passengers"
                              : "Bookings"}{" "}
                            for Route
                          </Typography>
                          <Grid item xs={12}>
                            <Typography variant="body2">
                              <strong>
                                Total{" "}
                                {routeDetails.isAssigned
                                  ? "Passengers"
                                  : "Bookings"}
                                :
                              </strong>{" "}
                              {routeDetails.passengerCount || 0}
                            </Typography>
                          </Grid>

                          {!routeDetails.isAssigned && (
                            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={
                                  <FontAwesomeIcon icon={faCheckDouble} />
                                }
                                onClick={() => handleConfirmAll(selectedRoute)}
                                disabled={!routeDetails.bookings?.length}
                                fullWidth
                              >
                                Confirm All
                              </Button>
                              <Button
                                variant="outlined"
                                color="primary"
                                startIcon={
                                  <FontAwesomeIcon icon={faFileExport} />
                                }
                                onClick={() => {
                                  setSnackbar({
                                    open: true,
                                    message: "Export feature coming soon!",
                                    severity: "info",
                                  });
                                }}
                                fullWidth
                              >
                                Export
                              </Button>
                            </Box>
                          )}

                          {routeDetails.isAssigned &&
                          routeDetails.passengers?.length > 0 ? (
                            <TableContainer
                              component={Paper}
                              sx={{ maxHeight: 400, overflow: "auto" }}
                            >
                              <Table size="small" stickyHeader>
                                <TableHead>
                                  <TableRow>
                                    <TableCell
                                      onClick={() => handleSort("userName")}
                                      sx={{ cursor: "pointer" }}
                                    >
                                      Name {getSortIcon("userName")}
                                    </TableCell>
                                    <TableCell>Email</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {routeDetails.passengers
                                    .sort((a, b) => {
                                      if (sortConfig.key === "userName") {
                                        const nameA = a.userName || "";
                                        const nameB = b.userName || "";
                                        return sortConfig.direction === "asc"
                                          ? nameA.localeCompare(nameB)
                                          : nameB.localeCompare(nameA);
                                      }
                                      return 0;
                                    })
                                    .map((passenger, index) => (
                                      <TableRow
                                        key={`${passenger.userId}-${index}`}
                                        hover
                                      >
                                        <TableCell>
                                          {passenger.userName ||
                                            passenger.userEmail}
                                        </TableCell>
                                        <TableCell>
                                          {passenger.userEmail}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (
                            <Typography
                              variant="body1"
                              color="textSecondary"
                              sx={{ p: 2, textAlign: "center" }}
                            >
                              No passengers found for this route
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Grid>

        {}
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

        {}
        <Dialog
          open={actionDialog.open}
          onClose={handleActionClose}
          aria-labelledby="action-dialog-title"
        >
          <DialogTitle id="action-dialog-title">
            {actionDialog.action === "confirm"
              ? "Confirm Booking"
              : "Reject Booking"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to{" "}
              {actionDialog.action === "confirm" ? "confirm" : "reject"} this
              booking?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleActionClose}>Cancel</Button>
            <Button
              onClick={handleActionConfirm}
              color={actionDialog.action === "confirm" ? "success" : "error"}
              autoFocus
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : actionDialog.action === "confirm" ? (
                "Confirm"
              ) : (
                "Reject"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {}
        <Dialog
          open={confirmAllDialog.open}
          onClose={handleConfirmAllClose}
          aria-labelledby="confirm-all-dialog-title"
        >
          <DialogTitle id="confirm-all-dialog-title">
            Confirm All Bookings
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to confirm all{" "}
              {groupedBookings[confirmAllDialog.routeId]?.count || 0} bookings
              for this route?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleConfirmAllClose}>Cancel</Button>
            <Button
              onClick={handleConfirmAllConfirm}
              color="success"
              autoFocus
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                `Confirm All (${
                  groupedBookings[confirmAllDialog.routeId]?.count || 0
                })`
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {}
        <Dialog
          open={assignmentDialog.open}
          onClose={handleAssignmentClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Assign Driver & Vehicle</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                <FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />
                Select Driver
              </Typography>
              <Autocomplete
                options={drivers}
                getOptionLabel={(option) => option.name}
                value={
                  drivers.find((d) => d.id === assignmentDialog.driverId) ||
                  null
                }
                onChange={(e, newValue) =>
                  setAssignmentDialog({
                    ...assignmentDialog,
                    driverId: newValue?.id || null,
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search drivers..."
                    fullWidth
                  />
                )}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                <FontAwesomeIcon icon={faCar} style={{ marginRight: 8 }} />
                Select Vehicle
              </Typography>
              <Autocomplete
                options={vehicles}
                getOptionLabel={(option) =>
                  `${option.make} ${option.model} (${option.plateNumber})` ||
                  "Unnamed Vehicle"
                }
                value={
                  vehicles.find((v) => v.id === assignmentDialog.vehicleId) ||
                  null
                }
                onChange={(e, newValue) =>
                  setAssignmentDialog({
                    ...assignmentDialog,
                    vehicleId: newValue?.id || null,
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search vehicles..."
                    fullWidth
                  />
                )}
              />
            </Box>

            {assignmentDialog.driverId && assignmentDialog.vehicleId && (
              <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Assignment Summary:</strong>
                </Typography>
                <Typography variant="body2">
                  <strong>Driver:</strong>{" "}
                  {
                    drivers.find((d) => d.id === assignmentDialog.driverId)
                      ?.name
                  }
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Vehicle:</strong>{" "}
                  {vehicles.find((v) => v.id === assignmentDialog.vehicleId)
                    ?.make +
                    " " +
                    vehicles.find((v) => v.id === assignmentDialog.vehicleId)
                      ?.model +
                    " (" +
                    vehicles.find((v) => v.id === assignmentDialog.vehicleId)
                      ?.plateNumber +
                    ")"}
                </Typography>
                <Typography variant="body2">
                  This will confirm all{" "}
                  {groupedBookings[assignmentDialog.routeId]?.count || 0}{" "}
                  bookings on this route and move it to assigned routes.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAssignmentClose}>Cancel</Button>
            <Button
              onClick={handleAssignDriverAndVehicle}
              color="primary"
              variant="contained"
              disabled={
                !assignmentDialog.driverId ||
                !assignmentDialog.vehicleId ||
                loading
              }
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <FontAwesomeIcon icon={faCheckCircle} />
                )
              }
            >
              {loading ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
};

export default RideAssign;
