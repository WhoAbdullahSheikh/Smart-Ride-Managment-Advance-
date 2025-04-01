import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Avatar,
  CircularProgress,
  Button,
  Chip,
  useTheme,
} from "@mui/material";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  FaEdit,
  FaEnvelope,
  FaUser,
  FaCalendarAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

const Profile = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const userFromSession = JSON.parse(sessionStorage.getItem("user"));

      if (userFromSession) {
        setUserData(userFromSession);
        setLoading(false);
      } else {
        const user = auth.currentUser;

        if (user) {
          try {
            const googleUserRef = doc(db, "google", user.uid);
            const googleUserDoc = await getDoc(googleUserRef);

            if (googleUserDoc.exists()) {
              setUserData(googleUserDoc.data().userData);
            } else {
              const emailUserRef = doc(db, "email", user.uid);
              const emailUserDoc = await getDoc(emailUserRef);

              if (emailUserDoc.exists()) {
                setUserData(emailUserDoc.data().userData);
              } else {
                console.error("No user data found in either collection");
              }
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          } finally {
            setLoading(false);
          }
        } else {
          console.error("No user is authenticated");
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#0f1728",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!userData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 2,
          backgroundColor: "#0f1728",
        }}
      >
        <Typography variant="h5" color="textSecondary">
          No profile data found
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        backgroundColor: "#0f1728",
        height: "100%",
        paddingRight: "10px",
        paddingLeft: "10px",
        paddingTop: "0px",
        borderRadius: "30px",
        paddingBottom: "20px",
      }}
    >
      <Box
        sx={{
          padding: { xs: "15px", md: "35px" },
          width: "95%",
          margin: "0 auto",
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily: "Raleway-Bold, sans-serif",
              color: "#fff",
              fontSize: { xs: "1.8rem", md: "2.5rem" },
            }}
          >
            My Profile
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FaSignOutAlt />}
            onClick={handleSignOut}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              borderColor: "#e74a3b",
              color: "#e74a3b",
              "&:hover": {
                backgroundColor: "#e74a3b20",
              },
            }}
          >
            Sign Out
          </Button>
        </Box>

        {/* Profile Content */}
        <Grid container spacing={3}>
          {/* Left Column - Avatar and Status */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                backgroundColor: "#1e293b",
                color: "#fff",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
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
                  border: `4px solid #4e73df`,
                }}
                alt={userData.displayName}
                src={userData.photoURL || undefined}
              >
                {!userData.photoURL && userData.displayName
                  ? userData.displayName[0]
                  : ""}
              </Avatar>

              <Button
                variant="contained"
                startIcon={<FaEdit />}
                sx={{
                  borderRadius: "8px",
                  width: "100%",
                  maxWidth: "200px",
                  backgroundColor: "#4e73df",
                  "&:hover": {
                    backgroundColor: "#3b5ab5",
                  },
                }}
              >
                Edit Profile
              </Button>

              <Box
                sx={{
                  width: "100%",
                  mt: 4,
                  p: 3,
                  backgroundColor: "#0f1728",
                  borderRadius: "8px",
                }}
              >
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                  Account Status
                </Typography>
                <Chip
                  label="Verified"
                  color="success"
                  size="small"
                  sx={{ borderRadius: "4px" }}
                />
                <Typography variant="body2" sx={{ mt: 2, color: "#94a3b8" }}>
                  Last login: {new Date().toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right Column - Profile Info */}
          <Grid item xs={12} md={8}>
            {/* Personal Information Box */}
            <Box
              sx={{
                backgroundColor: "#1e293b",
                color: "#fff",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                mb: 3,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "Raleway-Bold, sans-serif",
                  mb: 3,
                  color: "#fff",
                }}
              >
                Personal Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <InfoBox
                    icon={<FaUser style={{ color: "#4e73df" }} />}
                    title="Full Name"
                    value={userData.displayName}
                    color="#4e73df"
                  />
                </Grid>
                {userData.username && (
                  <Grid item xs={12} md={6}>
                    <InfoBox
                      icon={<FaUser style={{ color: "#f6c23e" }} />}
                      title="Username"
                      value={`@${userData.username}`}
                      color="#f6c23e"
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <InfoBox
                    icon={<FaCalendarAlt style={{ color: "#36b9cc" }} />}
                    title="Member Since"
                    value={
                      userData.createdAt?.seconds
                        ? new Date(
                            userData.createdAt.seconds * 1000
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "N/A"
                    }
                    color="#36b9cc"
                  />
                </Grid>
                <Grid item xs={12} md={60}>
                  <InfoBox
                    icon={<FaEnvelope style={{ color: "#1cc88a" }} />}
                    title="Email Address"
                    value={userData.email}
                    color="#1cc88a"
                  />
                </Grid>
              
              </Grid>
            </Box>

            {/* Account Settings Box */}
            <Box
              sx={{
                backgroundColor: "#1e293b",
                color: "#fff",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                height: "35%",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "Raleway-Bold, sans-serif",
                  mb: 3,
                  color: "#fff",
                }}
              >
                Account Settings
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <SettingButton title="Change Password" color="#4e73df" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <SettingButton
                    title="Notification Settings"
                    color="#1cc88a"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <SettingButton title="Privacy Settings" color="#f6c23e" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <SettingButton title="Connected Apps" color="#36b9cc" />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

// Reusable Info Box Component
const InfoBox = ({ icon, title, value, color }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "15px",
      p: "15px",
      backgroundColor: "#0f1728",
      borderRadius: "8px",
      borderLeft: `4px solid ${color}`,
    }}
  >
    <Box
      sx={{
        backgroundColor: `${color}20`,
        color: color,
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
      <Typography variant="subtitle2" sx={{ color: "#94a3b8" }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ color: "#fff" }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

// Reusable Setting Button Component
const SettingButton = ({ title, color }) => (
  <Button
    fullWidth
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: "8px",
      textAlign: "left",
      justifyContent: "flex-start",
      borderColor: color,
      color: "#fff",
      "&:hover": {
        backgroundColor: `${color}20`,
        borderColor: color,
      },
    }}
  >
    {title}
  </Button>
);

export default Profile;
