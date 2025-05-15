import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { FaCar, FaArrowLeft, FaSave } from "react-icons/fa";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUpload } from "react-icons/fi";

const VehicleRegistration = ({
  editMode = false,
  vehicleData: propVehicleData = null,
  onClose,
}) => {
  const [vehicleData, setVehicleData] = useState({
    plateNumber: "",
    make: "",
    model: "",
    year: "",
    color: "",
    vehicleType: "",
    capacity: "",
    registrationExpiry: "",
    status: "active",
  });
  const [vehicleImage, setVehicleImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [errors, setErrors] = useState({
    plateNumber: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (editMode && propVehicleData) {
      setVehicleData({
        plateNumber: propVehicleData.plateNumber || "",
        make: propVehicleData.make || "",
        model: propVehicleData.model || "",
        year: propVehicleData.year || "",
        color: propVehicleData.color || "",
        vehicleType: propVehicleData.vehicleType || "",
        capacity: propVehicleData.capacity || "",
        registrationExpiry: propVehicleData.registrationExpiry || "",
        status: propVehicleData.status || "active",
        vehicleRegID: propVehicleData.vehicleRegID || propVehicleData.id || "",
      });
  
      if (propVehicleData.vehicleImage) {
        setPreviewImage(propVehicleData.vehicleImage);
      }
    }
  }, [editMode, propVehicleData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVehicleData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setVehicleImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const checkForExistingPlate = async () => {
    try {
      const plateQuery = query(
        collection(db, "vehicles"),
        where("plateNumber", "==", vehicleData.plateNumber)
      );
      const plateSnapshot = await getDocs(plateQuery);
      if (!plateSnapshot.empty) {
        setErrors({ plateNumber: "This plate number is already registered" });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking plate number:", error);
      setSnackbar({
        open: true,
        message: "Error checking vehicle registration",
        severity: "error",
      });
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (
      !vehicleData.plateNumber ||
      !vehicleData.make ||
      !vehicleData.model ||
      !vehicleData.year
    ) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    try {
      let base64Image = previewImage;
      if (vehicleImage) {
        base64Image = await convertToBase64(vehicleImage);
      }

      if (editMode && propVehicleData) {
        await updateDoc(doc(db, "vehicles", propVehicleData.id), {
          ...vehicleData,
          vehicleImage: base64Image,
          updatedAt: new Date(),
        });

        setSnackbar({
          open: true,
          message: "Vehicle updated successfully!",
          severity: "success",
        });
      } else {
        const docRef = await addDoc(collection(db, "vehicles"), {
          ...vehicleData,
          vehicleImage: base64Image,
          vehicleRegID: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await updateDoc(docRef, {
          vehicleRegID: docRef.id,
        });

        setSnackbar({
          open: true,
          message: "Vehicle registered successfully!",
          severity: "success",
        });
      }

      if (!editMode) {
        setVehicleData({
          plateNumber: "",
          make: "",
          model: "",
          year: "",
          color: "",
          vehicleType: "",
          capacity: "",
          registrationExpiry: "",
          status: "active",
        });
        setVehicleImage(null);
        setPreviewImage("");
      }

      setTimeout(() => {
        if (editMode && onClose) {
          onClose();
        } else {
          navigate("/dashboard/vehicleregistration");
        }
      }, 2000);
    } catch (error) {
      console.error("Error processing vehicle:", error);
      setSnackbar({
        open: true,
        message: `Failed to ${editMode ? "update" : "register"} vehicle`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const vehicleTypes = ["Sedan", "SUV", "Van", "Truck", "Motorcycle", "Bus"];
  const years = Array.from(
    { length: 30 },
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ ml: 0 }}>
            Vehicle Registration
          </Typography>
        </Box>

        <Card
          component={motion.div}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          sx={{
            borderRadius: 3,
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              backgroundColor: "#0f1728",
              color: "white",
              p: 3,
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaCar size={24} style={{ marginRight: 12 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Vehicle Information
            </Typography>
          </Box>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3} sx={{ marginTop: "10px" }}>
                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        mb: 2,
                        "&:hover .upload-overlay": {
                          opacity: 1,
                        },
                      }}
                    >
                      <Avatar
                        src={previewImage}
                        sx={{
                          width: 150,
                          height: 150,
                          fontSize: "3rem",
                          border: `3px solid #0f1728`,
                          bgcolor: previewImage ? "transparent" : "#0f1728",
                        }}
                      >
                        {previewImage ? null : <FaCar size={48} />}
                      </Avatar>
                      <Box
                        className="upload-overlay"
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: "rgba(0,0,0,0.5)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: 0,
                          transition: "opacity 0.3s",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          accept="image/*"
                          style={{ display: "none" }}
                          id="vehicle-image-upload"
                          type="file"
                          onChange={handleImageChange}
                        />
                        <label
                          htmlFor="vehicle-image-upload"
                          style={{ cursor: "pointer" }}
                        >
                          <IconButton component="span" sx={{ color: "white" }}>
                            <FiUpload size={24} />
                          </IconButton>
                        </label>
                      </Box>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Click to upload vehicle photo
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={9}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="License Plate Number *"
                        name="plateNumber"
                        value={vehicleData.plateNumber}
                        onChange={handleChange}
                        required
                        error={!!errors.plateNumber}
                        helperText={errors.plateNumber}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          sx: { borderRadius: 2 },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Make *"
                        name="make"
                        value={vehicleData.make}
                        onChange={handleChange}
                        required
                        variant="outlined"
                        size="small"
                        InputProps={{
                          sx: { borderRadius: 2 },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Model *"
                        name="model"
                        value={vehicleData.model}
                        onChange={handleChange}
                        required
                        variant="outlined"
                        size="small"
                        InputProps={{
                          sx: { borderRadius: 2 },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Year *</InputLabel>
                        <Select
                          name="year"
                          value={vehicleData.year}
                          onChange={handleChange}
                          label="Year *"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          {years.map((year) => (
                            <MenuItem key={year} value={year}>
                              {year}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Color"
                        name="color"
                        value={vehicleData.color}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          sx: { borderRadius: 2 },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Vehicle Type</InputLabel>
                        <Select
                          name="vehicleType"
                          value={vehicleData.vehicleType}
                          onChange={handleChange}
                          label="Vehicle Type"
                          sx={{ borderRadius: 2 }}
                        >
                          {vehicleTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Passenger Capacity"
                        name="capacity"
                        type="number"
                        value={vehicleData.capacity}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          sx: { borderRadius: 2 },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Registration Expiry"
                        name="registrationExpiry"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={vehicleData.registrationExpiry}
                        onChange={handleChange}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          sx: { borderRadius: 2 },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status *</InputLabel>
                        <Select
                          name="status"
                          value={vehicleData.status}
                          onChange={handleChange}
                          label="Status *"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                          <MenuItem value="maintenance">
                            In Maintenance
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={loading}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        backgroundColor: "#0f1728",
                        fontWeight: 600,
                        boxShadow: "none",
                        "&:hover": {
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          transform: "translateY(-2px)",
                          transition: "all 0.3s",
                        },
                      }}
                      startIcon={<FaSave />}
                    >
                      {loading ? "Registering..." : "Register Vehicle"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              alignItems: "center",
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};

export default VehicleRegistration;
