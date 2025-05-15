import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Chip,
  Grid,
  Button,
} from "@mui/material";
import { FaEnvelope, FaIdCard, FaPhone, FaUser, FaCar, FaCalendarAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const DriverProfile = () => {
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDriverData = () => {
      const driverFromSession = JSON.parse(sessionStorage.getItem("driver"));

      if (driverFromSession) {
        setDriverData(driverFromSession);
        setLoading(false);
      } else {
        navigate("/signin");
      }
    };

    fetchDriverData();
  }, [navigate]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
      
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!driverData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5" color="textSecondary">
          No driver data found
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/signin")}
        >
          Sign In Again
        </Button>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: 4 }}>
        <Typography variant="h3" sx={{ mb: 4, fontWeight: "bold" }}>
          Driver Profile
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                padding: "25px",
                borderRadius: "15px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Avatar
                sx={{
                  width: 150,
                  height: 150,
                  marginBottom: 3,
                  fontSize: "3rem",
                }}
                alt={driverData.name}
                src={driverData.profileImage || undefined}
              >
                {!driverData.profileImage && driverData.name
                  ? driverData.name[0]
                  : ""}
              </Avatar>

              <Chip
                label={driverData.status || "active"}
                color={driverData.status === "active" ? "success" : "error"}
                sx={{ mb: 3 }}
              />

              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {driverData.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Driver ID: {driverData.userID}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                padding: "25px",
                borderRadius: "15px",
              }}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: "bold" }}>
                Driver Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <InfoBox
                    icon={<FaUser />}
                    title="Full Name"
                    value={driverData.name}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoBox
                    icon={<FaPhone />}
                    title="Phone Number"
                    value={driverData.phone}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoBox
                    icon={<FaEnvelope />}
                    title="Email"
                    value={driverData.email || "Not provided"}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoBox
                    icon={<FaIdCard />}
                    title="License Number"
                    value={driverData.licenseNumber}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoBox
                    icon={<FaCar />}
                    title="License Type"
                    value={driverData.licenseType}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoBox
                    icon={<FaCalendarAlt />}
                    title="Member Since"
                    value={formatDate(driverData.createdAt)}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

const InfoBox = ({ icon, title, value }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "15px",
      p: "15px",
      backgroundColor: "#fff",
      borderRadius: "8px",
      mb: 2,
      boxShadow: 1,
    }}
  >
    <Box
      sx={{
        backgroundColor: "#e3f2fd",
        color: "#1976d2",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="subtitle2" sx={{ color: "#757575" }}>
        {title}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Box>
  </Box>
);

export default DriverProfile;