import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import { FaPlus, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { TrafficLayer } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "800px",
  borderRadius: "30px",
};

const libraries = ["places"];

const CreateRoutes = () => {
  const navigate = useNavigate();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeForm, setRouteForm] = useState({
    name: "",
    origin: "",
    destination: "",
    waypoints: [],
    status: "active",
  });
  const [originPosition, setOriginPosition] = useState(null);
  const [destinationPosition, setDestinationPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [activeMarker, setActiveMarker] = useState("origin");
  const [showInstructions, setShowInstructions] = useState(false);
  const [editingRoute, setEditingRoute] = useState(false);
  const [showMapLoadMessage, setShowMapLoadMessage] = useState(true);

  useEffect(() => {
    setShowMapLoadMessage(true);

    if (!navigator.geolocation) {
      setSnackbar({
        open: true,
        message: "Geolocation is not supported by your browser",
        severity: "error",
      });
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = { lat: latitude, lng: longitude };
        setOriginPosition(newPosition);
        await updateAddressFromCoordinates(newPosition, "origin");
        setLocationLoading(false);
      },
      (err) => {
        setSnackbar({
          open: true,
          message: "Unable to retrieve your location",
          severity: "error",
        });
        setLocationLoading(false);
        console.error("Geolocation error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    const instructionsShown = localStorage.getItem("routeInstructionsShown");
    if (!instructionsShown) {
      setShowInstructions(true);
      localStorage.setItem("routeInstructionsShown", "true");
    }
  }, []);

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

      setRouteForm((prev) => ({
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
    setRouteForm((prev) => ({ ...prev, [field]: value }));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRouteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!routeForm.name || !routeForm.origin || !routeForm.destination) {
        setSnackbar({
          open: true,
          message: "Please fill all required fields",
          severity: "warning",
        });
        return;
      }

      setLoading(true);

      const routeData = {
        name: routeForm.name,
        origin: routeForm.origin,
        destination: routeForm.destination,
        waypoints: routeForm.waypoints,
        status: routeForm.status,
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

      navigate("/dashboard/createroutes");
    } catch (error) {
      console.error("Error saving route: ", error);
      setSnackbar({
        open: true,
        message: "Failed to save route",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
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
          autoHideDuration={16000}
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
            sx={{ width: '100%' }}
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

        {/* Error messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{
            "& .MuiSnackbar-root": {
              top: "80px",
              right: "24px",
            },
          }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Typography variant="h4" sx={{ mb: 3 }}>
          Add New Route
        </Typography>

        {/* Instructions Dialog */}
        <Dialog
          open={showInstructions}
          onClose={() => setShowInstructions(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            How to Set Your Route
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              <Box sx={{ mb: 2 }}>
                <strong>Setting your route is easy:</strong>
              </Box>
              <Box sx={{ mb: 2 }}>
                1. <strong>Click on the map</strong> to place markers
              </Box>
              <Box sx={{ mb: 2 }}>
                2. <strong>Drag the markers</strong> to adjust their position
              </Box>
              <Box sx={{ mb: 2 }}>
                3. <strong>Type addresses</strong> in the fields to search locations
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Chip label="Origin" sx={{ backgroundColor: "#ffebee", mr: 1 }} />
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: "red",
                    borderRadius: "50%",
                    mr: 1,
                  }}
                />
                <Typography>Red marker is for origin</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Chip label="Destination" sx={{ backgroundColor: "#e3f2fd", mr: 1 }} />
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: "blue",
                    borderRadius: "50%",
                    mr: 1,
                  }}
                />
                <Typography>Blue marker is for destination</Typography>
              </Box>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowInstructions(false)} autoFocus>
              Got it!
            </Button>
          </DialogActions>
        </Dialog>

        {/* Marker Legend */}
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: "red",
                borderRadius: "50%",
                mr: 1,
              }}
            />
            <Typography variant="body2">Origin</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: "blue",
                borderRadius: "50%",
                mr: 1,
              }}
            />
            <Typography variant="body2">Destination</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Tip: Click on the map or type addresses to set locations
            </Typography>
          </Box>
        </Box>

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
          onChange={(e) => handleAddressChange("origin", e.target.value)}
          onFocus={() => handleInputFocus("origin")}
          sx={{ mb: 2 }}
          required
        />

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Origin Latitude"
            value={originPosition ? originPosition.lat.toFixed(6) : ""}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="Origin Longitude"
            value={originPosition ? originPosition.lng.toFixed(6) : ""}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Box>

        <TextField
          margin="dense"
          name="destination"
          label="Destination Address"
          type="text"
          fullWidth
          variant="outlined"
          value={routeForm.destination}
          onChange={(e) => handleAddressChange("destination", e.target.value)}
          onFocus={() => handleInputFocus("destination")}
          sx={{ mb: 2 }}
          required
        />

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Destination Latitude"
            value={
              destinationPosition ? destinationPosition.lat.toFixed(6) : ""
            }
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="Destination Longitude"
            value={
              destinationPosition ? destinationPosition.lng.toFixed(6) : ""
            }
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Box>

        {locationLoading ? (
          <Box
            sx={{
              height: "600px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f5f5f5",
              borderRadius: "30px",
            }}
          >
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Getting your location...</Typography>
          </Box>
        ) : (
          <LoadScript
            googleMapsApiKey="AIzaSyByATEojq4YfKfzIIrRFA_1sAkKNKsnNeQ"
            libraries={libraries}
            onLoad={() => {
              setMapLoaded(true);
              setShowMapLoadMessage(false);
            }}
            onError={() => {
              setSnackbar({
                open: true,
                message: "Map failed to load. Please refresh your page.",
                severity: "error",
              });
            }}
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
        )}

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

        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 10,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/dashboard/createroutes")}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              loading ||
              !routeForm.name ||
              !routeForm.origin ||
              !routeForm.destination ||
              !originPosition
            }
            startIcon={loading ? <CircularProgress size={20} /> : <FaSave />}
          >
            Save Route
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
};

export default CreateRoutes;