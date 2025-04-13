import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Avatar,
  CircularProgress,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  FaEdit,
  FaEnvelope,
  FaUser,
  FaCalendarAlt,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaHistory,
  FaTrash,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

const ActivityDialog = ({
  open,
  onClose,
  loginActivities,
  onDeleteActivity,
}) => {
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const toggleSortOrder = () => {
    setSortNewestFirst(!sortNewestFirst);
  };

  const formatDateWithTextMonth = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const sortedActivities = [...loginActivities].sort((a, b) => {
    return sortNewestFirst
      ? new Date(b.timestamp) - new Date(a.timestamp)
      : new Date(a.timestamp) - new Date(b.timestamp);
  });

  const handleDelete = (index) => {
    const activityToDelete = sortedActivities[index];
    onDeleteActivity(activityToDelete.id || activityToDelete.timestamp);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#0f1728",
          color: "#fff",
          borderRadius: "30px",
          fontFamily: "Raleway, sans-serif",
        },
      }}
    >
      <DialogTitle
        sx={{ fontFamily: "Raleway, sans-serif", fontWeight: "bold" }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <FaHistory style={{ marginRight: "10px" }} />
            Your Login Activity
          </Box>
          {loginActivities && loginActivities.length > 0 && (
            <Button
              onClick={toggleSortOrder}
              variant="outlined"
              size="small"
              sx={{
                color: "#fff",
                borderColor: "#334155",
                fontFamily: "Raleway, sans-serif",
                fontSize: "0.75rem",
                "&:hover": {
                  borderColor: "#64748b",
                },
              }}
            >
              {sortNewestFirst ? "Oldest → Newest" : "Newest → Oldest"}
            </Button>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {loginActivities && loginActivities.length > 0 ? (
            <List sx={{ maxHeight: 400, overflow: "auto" }}>
              {sortedActivities.map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(index)}
                        sx={{ color: "#e74c3c", fontSize: "18px" }}
                      >
                        <FaTrash />
                      </IconButton>
                    }
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        width: "100%",
                        flexDirection: "column",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <Box
                          sx={{
                            minWidth: "30px",
                            textAlign: "right",
                            marginRight: "15px",
                            color: "#94a3b8",
                            fontFamily: "Raleway, sans-serif",
                          }}
                        >
                          {sortNewestFirst
                            ? index + 1
                            : loginActivities.length - index}
                          .
                        </Box>
                        <ListItemText
                          primary={formatDateWithTextMonth(activity.timestamp)}
                          secondary={
                            <>
                              <Box component="span" display="block">
                                Device: {activity.device.type}{" "}
                                {activity.device.model &&
                                  `(${activity.device.model})`}
                              </Box>
                              <Box component="span" display="block">
                                OS: {activity.device.os} | Browser:{" "}
                                {activity.device.browser}
                              </Box>
                              <Box component="span" display="block">
                                IP: {activity.ip || "Not available"}
                              </Box>
                            </>
                          }
                          primaryTypographyProps={{
                            fontFamily: "Calibri, sans-serif",
                            color: "#fff",
                          }}
                          secondaryTypographyProps={{
                            fontFamily: "Calibri, sans-serif",
                            color: "#94a3b8",
                            fontSize: "0.8rem",
                          }}
                        />
                      </Box>
                      {activity.location && (
                        <Box
                          sx={{
                            marginLeft: "45px",
                            color: "#64748b",
                            fontSize: "0.75rem",
                            fontFamily: "Raleway, sans-serif",
                          }}
                        >
                          Approximate location: {activity.location}
                        </Box>
                      )}
                    </Box>
                  </ListItem>
                  {index < sortedActivities.length - 1 && (
                    <Divider sx={{ backgroundColor: "#334155" }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography fontFamily="Raleway, sans-serif">
              No login activity recorded yet
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{ color: "#fff", fontFamily: "Raleway, sans-serif" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let device = "Unknown device";

  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      userAgent
    )
  ) {
    device = "Mobile";
    if (/Android/.test(userAgent)) device = "Android Device";
    if (/iPhone|iPad|iPod/.test(userAgent)) device = "iOS Device";
  } else {
    device = "Desktop";
    if (/Windows/.test(userAgent)) device = "Windows PC";
    if (/Mac/.test(userAgent)) device = "Mac";
    if (/Linux/.test(userAgent)) device = "Linux PC";
  }

  return device;
};

const getLocationFromIP = async (ip) => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    if (data.error) return null;

    let location = "";
    if (data.city) location += `${data.city}, `;
    if (data.region) location += `${data.region}, `;
    if (data.country_name) location += data.country_name;

    return location || null;
  } catch (error) {
    console.error("Error fetching location:", error);
    return null;
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({
    displayName: "",
    username: "",
    email: "",
  });
  const [authProvider, setAuthProvider] = useState(null);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [loginActivities, setLoginActivities] = useState([]);

  const handleClickShowPassword = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      let userRef;
      const googleUserDoc = await getDoc(doc(db, "google", user.uid));
      if (googleUserDoc.exists()) {
        userRef = doc(db, "google", user.uid);
      } else {
        userRef = doc(db, "email", user.uid);
      }

      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentActivities = userDoc.data().loginActivities || [];

        const updatedActivities = currentActivities.filter(
          (activity) => (activity.id || activity.timestamp) !== activityId
        );

        await updateDoc(userRef, {
          loginActivities: updatedActivities,
        });

        setLoginActivities(updatedActivities);

        setSnackbar({
          open: true,
          message: "Activity deleted successfully",
          severity: "success",
        });
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete activity",
        severity: "error",
      });
    }
  };

  const fetchLoginActivity = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      let userRef;
      const googleUserDoc = await getDoc(doc(db, "google", user.uid));
      if (googleUserDoc.exists()) {
        userRef = doc(db, "google", user.uid);
      } else {
        userRef = doc(db, "email", user.uid);
      }

      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const activities = userDoc.data().loginActivities || [];
        const enhancedActivities = await Promise.all(
          activities.map(async (activity) => {
            if (activity.location || !activity.ip) return activity;
            const location = await getLocationFromIP(activity.ip);
            return location ? { ...activity, location } : activity;
          })
        );
        setLoginActivities(enhancedActivities);
      }
    } catch (error) {
      console.error("Error fetching login activity:", error);
    }
  };

  const handleActivityClick = async () => {
    await fetchLoginActivity();
    setActivityDialogOpen(true);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const userFromSession = JSON.parse(sessionStorage.getItem("user"));

      if (userFromSession) {
        setUserData(userFromSession);
        if (userFromSession.providerData && userFromSession.providerData[0]) {
          setAuthProvider(userFromSession.providerData[0].providerId);
        } else {
          const user = auth.currentUser;
          if (user && user.providerData && user.providerData[0]) {
            setAuthProvider(user.providerData[0].providerId);
          }
        }
        setLoading(false);
      } else {
        const user = auth.currentUser;
        if (user) {
          try {
            if (user.providerData && user.providerData.length > 0) {
              const provider = user.providerData[0].providerId;
              setAuthProvider(provider);
            }

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

  const handleEditClick = () => {
    setEditedData({
      displayName: userData.displayName || "",
      username: userData.username || "",
      email: userData.email || "",
    });
    setEditMode(true);
  };

  const handleSaveChanges = async () => {
    try {
      if (!editedData.displayName.trim()) {
        setSnackbar({
          open: true,
          message: "Full name cannot be empty",
          severity: "error",
        });
        return;
      }

      if (!editedData.username.trim()) {
        setSnackbar({
          open: true,
          message: "Username cannot be empty",
          severity: "error",
        });
        return;
      }

      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      let userRef;
      const googleUserDoc = await getDoc(doc(db, "google", user.uid));
      if (googleUserDoc.exists()) {
        userRef = doc(db, "google", user.uid);
      } else {
        userRef = doc(db, "email", user.uid);
      }

      await updateDoc(userRef, {
        "userData.displayName": editedData.displayName.trim(),
        "userData.username": editedData.username.trim(),
      });

      setUserData({
        ...userData,
        displayName: editedData.displayName.trim(),
        username: editedData.username.trim(),
      });

      const updatedUser = {
        ...userData,
        displayName: editedData.displayName.trim(),
        username: editedData.username.trim(),
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      setSnackbar({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({
        open: true,
        message: "Failed to update profile",
        severity: "error",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleChangePassword = async () => {
    try {
      let isValid = true;
      const newErrors = {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      };

      if (!passwordData.currentPassword) {
        newErrors.currentPassword = "Current password is required";
        isValid = false;
      }

      if (!passwordData.newPassword) {
        newErrors.newPassword = "New password is required";
        isValid = false;
      } else if (passwordData.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
        isValid = false;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }

      if (!isValid) {
        setPasswordErrors(newErrors);
        return;
      }

      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);

      setSnackbar({
        open: true,
        message: "Password changed successfully!",
        severity: "success",
      });
      setChangePasswordMode(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      let message = "Failed to change password";
      if (error.code === "auth/wrong-password") {
        message = "Current password is incorrect";
        setPasswordErrors((prev) => ({
          ...prev,
          currentPassword: message,
        }));
      } else if (error.code === "auth/weak-password") {
        message = "Password should be at least 6 characters";
        setPasswordErrors((prev) => ({
          ...prev,
          newPassword: message,
        }));
      }
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#fff",
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
        height: "100%",
        paddingRight: "10px",
        paddingLeft: "10px",
        paddingTop: "0px",
        borderRadius: "10px",
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
              color: "#0f1728",
              fontSize: { xs: "1.8rem", md: "2.5rem" },
            }}
          >
            Profile
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                backgroundColor: "#1e293b",
                color: "#fff",
                padding: "25px",
                borderRadius: "40px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
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
                  border: `5px solid #0f1728`,
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
                onClick={handleEditClick}
                sx={{
                  borderRadius: "8px",
                  width: "100%",
                  maxWidth: "200px",
                  backgroundColor: "#0f1728",
                  "&:hover": {
                    backgroundColor: "#384561",
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
                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: "bold",
                    fontFamily: "Raleway, sans-serif",
                  }}
                >
                  Account Status
                </Typography>
                <Chip
                  label="Verified"
                  color="success"
                  size="small"
                  sx={{ borderRadius: "4px" }}
                />
                <Typography variant="body2" sx={{ mt: 2, color: "#94a3b8" }}>
                  Current device: {getDeviceInfo()}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Box
              sx={{
                backgroundColor: "#1e293b",
                color: "#fff",
                padding: "25px",
                borderRadius: "40px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
                mb: 3,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "Raleway, sans-serif",
                  mb: 3,
                  color: "#fff",
                }}
              >
                Personal Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={20}>
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
                <Grid item xs={12} md={30}>
                  <InfoBox
                    icon={<FaEnvelope style={{ color: "#1cc88a" }} />}
                    title="Email Address"
                    value={userData.email}
                    color="#1cc88a"
                  />
                </Grid>
              </Grid>
            </Box>

            <Box
              sx={{
                backgroundColor: "#1e293b",
                color: "#fff",
                padding: "25px",
                borderRadius: "40px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
                height: "28%",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "Raleway, sans-serif",
                  mb: 3,
                  color: "#fff",
                }}
              >
                Account Settings
              </Typography>

              <Grid container spacing={2}>
                {authProvider !== "google.com" && (
                  <Grid item xs={12} sm={6}>
                    <SettingButton
                      title="Change Password"
                      color="#4e73df"
                      onClick={() => setChangePasswordMode(true)}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <SettingButton
                    title="Login Activity"
                    color="#36b9cc"
                    onClick={handleActivityClick}
                  />
                </Grid>
              </Grid>
            </Box>

            <ActivityDialog
              open={activityDialogOpen}
              onClose={() => setActivityDialogOpen(false)}
              loginActivities={loginActivities}
              onDeleteActivity={handleDeleteActivity}
            />
          </Grid>
        </Grid>
      </Box>

      {authProvider !== "google.com" && (
        <Dialog
          open={changePasswordMode}
          onClose={() => setChangePasswordMode(false)}
          fullWidth
          maxWidth="sm"
          sx={{
            "& .MuiDialog-paper": {
              backgroundColor: "#0f1728",
              color: "#fff",
              borderRadius: "30px",
              fontFamily: "Raleway, sans-serif",
            },
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: "Raleway, sans-serif",
              fontWeight: "bold",
            }}
          >
            Change Password
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                required
                type={showPassword.current ? "text" : "password"}
                label="Current Password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordInputChange}
                sx={{
                  mb: 3,
                  borderRadius: "40px",
                  backgroundColor: "#1e293b",
                  "& .MuiInputLabel-root": {
                    color: "#fff",
                    fontFamily: "Raleway, sans-serif",
                    "&.Mui-focused": {
                      color: "#1e293b",
                    },
                  },
                }}
                InputLabelProps={{
                  sx: { color: "#fff !important" },
                }}
                InputProps={{
                  sx: {
                    color: "#fff",
                    borderRadius: "40px",
                    fontFamily: "Raleway, sans-serif",
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleClickShowPassword("current")}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        sx={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={!!passwordErrors.currentPassword}
                helperText={passwordErrors.currentPassword}
              />

              <TextField
                fullWidth
                required
                type={showPassword.new ? "text" : "password"}
                label="New Password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                sx={{
                  borderRadius: "40px",
                  mb: 3,
                  backgroundColor: "#1e293b",
                  "& .MuiInputLabel-root": {
                    color: "#fff",
                    fontFamily: "Raleway, sans-serif",
                    "&.Mui-focused": {
                      color: "#1e293b",
                    },
                  },
                }}
                InputLabelProps={{
                  sx: { color: "#fff !important" },
                }}
                InputProps={{
                  sx: {
                    borderRadius: "40px",
                    color: "#fff",
                    fontFamily: "Raleway, sans-serif",
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleClickShowPassword("new")}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        sx={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={!!passwordErrors.newPassword}
                helperText={passwordErrors.newPassword}
              />

              <TextField
                fullWidth
                required
                type={showPassword.confirm ? "text" : "password"}
                label="Confirm New Password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                sx={{
                  borderRadius: "40px",
                  mb: 3,
                  backgroundColor: "#1e293b",
                  "& .MuiInputLabel-root": {
                    color: "#fff",
                    fontFamily: "Raleway, sans-serif",
                    "&.Mui-focused": {
                      color: "#1e293b",
                    },
                  },
                }}
                InputLabelProps={{
                  sx: { color: "#fff !important" },
                }}
                InputProps={{
                  sx: {
                    borderRadius: "40px",
                    color: "#fff",
                    fontFamily: "Raleway, sans-serif",
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleClickShowPassword("confirm")}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        sx={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={!!passwordErrors.confirmPassword}
                helperText={passwordErrors.confirmPassword}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setChangePasswordMode(false);
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setPasswordErrors({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setShowPassword({
                  current: false,
                  new: false,
                  confirm: false,
                });
              }}
              sx={{
                color: "#fff",
                fontFamily: "Raleway, sans-serif",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              variant="contained"
              sx={{
                backgroundColor: "green",
                color: "#fff",
                fontFamily: "Raleway, sans-serif",
              }}
            >
              Change Password
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog
        open={editMode}
        onClose={() => setEditMode(false)}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-paper": {
            backgroundColor: "#0f1728",
            color: "#fff",
            borderRadius: "30px",
            fontFamily: "Raleway, sans-serif",
          },
        }}
      >
        <DialogTitle
          sx={{ fontFamily: "Raleway, sans-serif", fontWeight: "bold" }}
        >
          Edit Profile
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              required
              label="Full Name"
              name="displayName"
              value={editedData.displayName}
              onChange={handleInputChange}
              sx={{
                borderRadius: "40px",
                mb: 3,
                backgroundColor: "#1e293b",
                "& .MuiInputLabel-root": {
                  color: "#fff",
                  fontFamily: "Raleway, sans-serif",
                  "&.Mui-focused": {
                    color: "#1e293b",
                  },
                },
              }}
              InputLabelProps={{
                sx: { color: "#fff !important" },
              }}
              InputProps={{
                sx: {
                  borderRadius: "40px",
                  color: "#fff",
                  fontFamily: "Raleway, sans-serif",
                },
              }}
              error={!editedData.displayName.trim()}
              helperText={
                !editedData.displayName.trim() ? "Full name is required" : ""
              }
            />

            <TextField
              fullWidth
              required
              label="Username"
              name="username"
              value={editedData.username}
              onChange={handleInputChange}
              sx={{
                borderRadius: "40px",
                mb: 3,
                backgroundColor: "#1e293b",
                "& .MuiInputLabel-root": {
                  color: "#fff",
                  "&.Mui-focused": {
                    color: "#1e293b",
                  },
                },
              }}
              InputLabelProps={{
                sx: {
                  color: "#fff !important",
                  fontFamily: "Raleway, sans-serif",
                },
              }}
              InputProps={{
                sx: {
                  borderRadius: "40px",
                  color: "#fff",
                  fontFamily: "Raleway, sans-serif",
                },
                startAdornment: (
                  <Typography sx={{ mr: 0, color: "#fff" }}>@</Typography>
                ),
              }}
              error={!editedData.username.trim()}
              helperText={
                !editedData.username.trim() ? "Username is required" : ""
              }
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={editedData.email}
              onChange={handleInputChange}
              disabled
              sx={{
                borderRadius: "40px",
                mb: 3,
                backgroundColor: "#1e293b",
                "& .MuiInputLabel-root": {
                  color: "#fff",
                  "&.Mui-focused": {
                    color: "#1e293b",
                  },
                },
                "& .MuiInputBase-root.Mui-disabled": {
                  color: "#fff",
                  "& .Mui-disabled": {
                    WebkitTextFillColor: "#919191",
                    fontFamily: "Raleway, sans-serif",
                  },
                },
              }}
              InputLabelProps={{
                sx: {
                  color: "#fff !important",
                  fontFamily: "Raleway, sans-serif",
                },
              }}
              InputProps={{
                sx: {
                  color: "#fff",
                  "&::before": { borderBottomColor: "#fff" },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditMode(false)}
            sx={{
              color: "#fff",
              fontFamily: "Raleway, sans-serif",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            variant="contained"
            startIcon={<FaSave />}
            sx={{
              backgroundColor: "green",
              color: "#fff",
              fontFamily: "Raleway, sans-serif",
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

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
    </motion.div>
  );
};

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
      <Typography
        variant="h6"
        sx={{ color: "#fff", fontFamily: "Raleway, sans-serif" }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

const SettingButton = ({ title, color, onClick }) => (
  <Button
    fullWidth
    variant="outlined"
    onClick={onClick}
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
