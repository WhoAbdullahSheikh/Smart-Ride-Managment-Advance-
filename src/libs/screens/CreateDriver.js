import React, { useState } from "react";
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
import { FaUserPlus, FaArrowLeft } from "react-icons/fa";
import {
  addDoc,
  collection,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUpload } from "react-icons/fi";
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";

const CreateDriver = () => {
  const [driverData, setDriverData] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    licenseType: "",
    status: "active",
  });
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [errors, setErrors] = useState({
    email: "",
    phone: "",
    licenseNumber: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDriverData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
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

  const checkForExistingRecords = async () => {
    const errors = {};
    let hasErrors = false;

    if (driverData.email) {
      try {
        // 1. Check Firebase Authentication
        const signInMethods = await fetchSignInMethodsForEmail(
          auth,
          driverData.email
        );
        if (signInMethods.length > 0) {
          errors.email = "Email already registered in authentication";
          hasErrors = true;
        }

        // 2. Check all collections in parallel
        const collectionsToCheck = [
          { name: "google", fieldPath: "userData.email" },
          { name: "email", fieldPath: "userData.email" },
          { name: "drivers", fieldPath: "userData.email" },
        ];

        const queryPromises = collectionsToCheck.map(({ name, fieldPath }) => {
          const q = query(
            collection(db, name),
            where(fieldPath, "==", driverData.email)
          );
          return getDocs(q);
        });

        const querySnapshots = await Promise.all(queryPromises);

        // Check if any collection has this email
        const emailExists = querySnapshots.some((snapshot) => !snapshot.empty);

        if (emailExists) {
          errors.email = "Email already exists in our system";
          hasErrors = true;
        }
      } catch (error) {
        console.error("Error checking email existence:", error);
        errors.email = "Error checking email availability";
        hasErrors = true;
      }
    }

    // Rest of your existing checks for phone and license...
    try {
      const phoneQuery = query(
        collection(db, "drivers"),
        where("userData.phone", "==", driverData.phone)
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        errors.phone = "Phone number already exists";
        hasErrors = true;
      }
    } catch (error) {
      console.error("Error checking phone number:", error);
      errors.phone = "Error checking phone number";
      hasErrors = true;
    }

    try {
      const licenseQuery = query(
        collection(db, "drivers"),
        where("userData.licenseNumber", "==", driverData.licenseNumber)
      );
      const licenseSnapshot = await getDocs(licenseQuery);
      if (!licenseSnapshot.empty) {
        errors.licenseNumber = "License number already exists";
        hasErrors = true;
      }
    } catch (error) {
      console.error("Error checking license number:", error);
      errors.licenseNumber = "Error checking license number";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(errors);
      return false;
    }

    return true;
  };

  const registerDriverInAuth = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user.uid;
    } catch (error) {
      console.error("Error registering driver in authentication:", error);
      let errorMessage = "Failed to register driver";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already registered";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      }

      throw new Error(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (
      !driverData.name ||
      !driverData.phone ||
      !driverData.licenseNumber ||
      !driverData.licenseType ||
      (driverData.email && !password)
    ) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    if (driverData.email && password.length < 6) {
      setErrors({
        ...errors,
        password: "Password must be at least 6 characters",
      });
      setLoading(false);
      return;
    }

    const isValid = await checkForExistingRecords();
    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      let authUid = null;

      // Register in Firebase Auth if email is provided
      if (driverData.email) {
        authUid = await registerDriverInAuth(driverData.email, password);
      }

      let base64Image = "";
      if (profileImage) {
        base64Image = await convertToBase64(profileImage);
      }

      const driverDoc = {
        userData: {
          ...driverData,
          profileImage: base64Image,
          createdAt: new Date(),
          updatedAt: new Date(),
          authUid: authUid, // Store the auth UID if available
        },
      };

      const docRef = await addDoc(collection(db, "drivers"), driverDoc);
      const userID = docRef.id;
      await updateDoc(docRef, {
        "userData.userID": userID,
      });

      setSnackbar({
        open: true,
        message: "Driver created successfully!",
        severity: "success",
      });

      // Reset form
      setDriverData({
        name: "",
        email: "",
        phone: "",
        licenseNumber: "",
        licenseType: "",
        status: "active",
      });
      setPassword("");
      setProfileImage(null);
      setPreviewImage("");
      setErrors({
        email: "",
        phone: "",
        licenseNumber: "",
        password: "",
      });

      setTimeout(() => navigate("/dashboard/drivers"), 2000);
    } catch (error) {
      console.error("Error creating driver:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to create driver",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const licenseTypes = ["Sedan", "SUV", "Van", "Truck", "Motorcycle", "Other"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ ml: 0 }}>
            Driver Creation
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
            <FaUserPlus size={24} style={{ marginRight: 12 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Driver Information
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
                        }}
                      >
                        {driverData.name.charAt(0)}
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
                          id="profile-image-upload"
                          type="file"
                          onChange={handleImageChange}
                        />
                        <label
                          htmlFor="profile-image-upload"
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
                      Click to upload profile photo
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={9}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name *"
                        name="name"
                        value={driverData.name}
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
                        label="Email"
                        name="email"
                        type="email"
                        value={driverData.email}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          sx: { borderRadius: 2 },
                        }}
                      />
                    </Grid>
                    {driverData.email && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Password *"
                          type="password"
                          value={password}
                          onChange={handlePasswordChange}
                          required
                          error={!!errors.password}
                          helperText={errors.password}
                          variant="outlined"
                          size="small"
                          InputProps={{
                            sx: { borderRadius: 2 },
                          }}
                        />
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number *"
                        name="phone"
                        value={driverData.phone}
                        onChange={handleChange}
                        required
                        error={!!errors.phone}
                        helperText={errors.phone}
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
                        label="License Number *"
                        name="licenseNumber"
                        value={driverData.licenseNumber}
                        onChange={handleChange}
                        required
                        error={!!errors.licenseNumber}
                        helperText={errors.licenseNumber}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          sx: { borderRadius: 2 },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>License Type *</InputLabel>
                        <Select
                          name="licenseType"
                          value={driverData.licenseType}
                          onChange={handleChange}
                          label="License Type *"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          {licenseTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status *</InputLabel>
                        <Select
                          name="status"
                          value={driverData.status}
                          onChange={handleChange}
                          label="Status *"
                          required
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                          <MenuItem value="on-leave">On Leave</MenuItem>
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
                      startIcon={<FaUserPlus />}
                    >
                      {loading ? "Creating..." : "Create Driver Profile"}
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

export default CreateDriver;
