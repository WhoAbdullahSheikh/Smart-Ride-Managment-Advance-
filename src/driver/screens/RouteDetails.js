import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Avatar,
} from "@mui/material"; 
import { db } from "../firebase";
import { collection, doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { FaRoute, FaCar, FaClock, FaMapMarkerAlt, FaUser, FaPaperPlane, FaCarSide, FaBell } from "react-icons/fa";

const DriverAlerts = ({ route }) => {
  const [message, setMessage] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!route?.id) return;
    
    const fetchAlerts = async () => {
      const alertRef = doc(db, "alerts", route.id);
      const alertSnap = await getDoc(alertRef);
      
      if (alertSnap.exists()) {
        setAlerts(alertSnap.data().messages || []);
      } else {
        await setDoc(alertRef, {
          routeId: route.id,
          driverId: route.assignedDriverId,
          passengerIds: route.passengers.map(p => p.userId),
          messages: []
        });
        setAlerts([]);
      }
    };
    
    fetchAlerts();
  }, [route]);

  const sendAlert = async () => {
    if (!message.trim() || !route?.id) return;
    
    setLoading(true);
    try {
      const newAlert = {
        text: message,
        timestamp: new Date(),
        type: "driver_message"
      };
      
      const alertRef = doc(db, "alerts", route.id);
      await updateDoc(alertRef, {
        messages: arrayUnion(newAlert)
      });
      
      setAlerts(prev => [...prev, newAlert]);
      setMessage("");
    } catch (error) {
      console.error("Error sending alert:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendStatusUpdate = async (status) => {
    const statusMessages = {
      started: "Driver has started the ride",
      approaching: "Approaching pickup location",
      arrived: "Arrived at pickup location",
      departed: "Departed from pickup location",
      completed: "Ride completed"
    };
    
    setLoading(true);
    try {
      const newAlert = {
        text: statusMessages[status],
        timestamp: new Date(),
        type: "status_update"
      };
      
      const alertRef = doc(db, "alerts", route.id);
      await updateDoc(alertRef, {
        messages: arrayUnion(newAlert)
      });
      
      setAlerts(prev => [...prev, newAlert]);
    } catch (error) {
      console.error("Error sending status update:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
        <FaBell sx={{ mr: 1 }} /> Ride Alerts
      </Typography>
      
      {}
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Button 
          variant="outlined" 
          startIcon={<FaCarSide />}
          onClick={() => sendStatusUpdate("started")}
          disabled={loading}
        >
          Start Ride
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => sendStatusUpdate("approaching")}
          disabled={loading}
        >
          Approaching
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => sendStatusUpdate("arrived")}
          disabled={loading}
        >
          Arrived
        </Button>
      </Box>
      
      {}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Send message to passengers..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={sendAlert}
          disabled={!message.trim() || loading}
          startIcon={<FaPaperPlane />}
        >
          Send
        </Button>
      </Box>
      
      {}
      {alerts.length > 0 ? (
        <List sx={{ maxHeight: 300, overflow: "auto" }}>
          {alerts.map((alert, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start">
                <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
                  <FaBell />
                </Avatar>
                <ListItemText
                  primary={alert.text}
                  secondary={new Date(alert.timestamp).toLocaleString()}
                />
              </ListItem>
              {index < alerts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
          No alerts sent yet
        </Typography>
      )}
    </Paper>
  );
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

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: "12px" }}>
      {}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" sx={{ display: "flex", alignItems: "center" }}>
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
                  )}, Lng: ${route.destinationCoordinates.longitude.toFixed(6)}`
                : "N/A"
            }
          />
        </Box>
      </Box>

      {}
      {route.passengers?.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1, display: "flex", alignItems: "center" }}>
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
                        <DriverAlerts route={route} />
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
      <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>
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

export default RouteDetails;