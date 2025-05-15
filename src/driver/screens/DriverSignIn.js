import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { UAParser } from "ua-parser-js";
import { FaEnvelope, FaLock, FaPhone } from "react-icons/fa";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import {
  arrayUnion,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import backgroundImage from "../../assets/images/login.png";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const DriverSignIn = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [resetEmail, setResetEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getDeviceInfo = () => {
    const parser = new UAParser();
    const result = parser.getResult();
    return {
      type: result.device.type || "desktop",
      model: result.device.model || "unknown",
      os: result.os.name || "unknown",
      browser: result.browser.name || "unknown",
    };
  };

  const handleDriverSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const isPhoneNumber = /^\+?[0-9]{10,15}$/.test(identifier);

      if (isPhoneNumber) {
        const driversQuery = query(
          collection(db, "drivers"),
          where("userData.phone", "==", identifier)
        );
        const querySnapshot = await getDocs(driversQuery);

        if (querySnapshot.empty) {
          throw new Error("No driver found with this phone number");
        }

        const driverDoc = querySnapshot.docs[0];
        const driverData = driverDoc.data().userData;

        sessionStorage.setItem(
          "driver",
          JSON.stringify({
            ...driverData,
            uid: driverDoc.id,
            displayName: driverData.name,
          })
        );

        const loginActivity = {
          timestamp: new Date().toISOString(),
          device: getDeviceInfo(),
          ip: await fetch("https://api.ipify.org?format=json")
            .then((response) => response.json())
            .then((data) => data.ip)
            .catch(() => "IP not available"),
        };

        await updateDoc(doc(db, "drivers", driverDoc.id), {
          loginActivities: arrayUnion(loginActivity),
        });

        setSnackbarMessage("Successfully logged in as driver!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);

        setTimeout(() => {
          navigate("/driverdashboard");
        }, 2000);
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          identifier,
          password
        );
        const user = userCredential.user;

        const driverRef = doc(db, "drivers", user.uid);
        const driverDoc = await getDoc(driverRef);

        if (!driverDoc.exists()) {
          await auth.signOut();
          throw new Error("Driver account not found in database");
        }

        const driverData = driverDoc.data().userData;

        const loginActivity = {
          timestamp: new Date().toISOString(),
          device: getDeviceInfo(),
          ip: await fetch("https://api.ipify.org?format=json")
            .then((response) => response.json())
            .then((data) => data.ip)
            .catch(() => "IP not available"),
        };

        await updateDoc(driverRef, {
          loginActivities: arrayUnion(loginActivity),
        });

        sessionStorage.setItem(
          "driver",
          JSON.stringify({
            ...driverData,
            uid: user.uid,
            email: user.email,
            displayName: driverData.name,
            createdAt: driverData.createdAt,
            licenseNumber: driverData.licenseNumber,
            licenseType: driverData.licenseType,
            phone: driverData.phone,
            profileImage: driverData.profileImage,
            status: driverData.status,
          })
        );

        setSnackbarMessage("Successfully logged in!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);

        setTimeout(() => {
          navigate("/driverdashboard");
        }, 2000);
      }
    } catch (error) {
      console.error("Error signing in:", error);
      setLoading(false);

      let errorMessage = "Error during sign-in. Please try again.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "This account does not exist.";
      } else if (
        error.message === "Driver account not found in database" ||
        error.message === "No driver found with this phone number"
      ) {
        errorMessage = error.message;
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      }

      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleForgotPassword = () => {
    setResetDialogOpen(true);
    setResetSuccess(false);
    setResetEmail(identifier);
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess(true);
      setSnackbarMessage("Password reset email sent. Please check your inbox.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error sending reset email:", error);
      let errorMessage = "Error sending password reset email.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      }
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: "0",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          filter: "brightness(0.3)",
          zIndex: -1,
        },
      }}
    >
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Container
        component="main"
        maxWidth="xs"
        sx={{
          display: "flex",
          justifyContent: "center",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "30px",
            borderRadius: "30px",
            boxShadow: 5,
          }}
        >
          <Typography
            variant="h4"
            sx={{ mb: 2, fontFamily: "Raleway, sans-serif" }}
          >
            Driver Sign In
          </Typography>

          <form onSubmit={handleDriverSignIn} style={{ width: "100%" }}>
            <TextField
              required
              fullWidth
              label="Email or Phone Number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <>
                    {/^[0-9]/.test(identifier) ? (
                      <FaPhone
                        style={{ marginRight: "15px", color: "#0f1728" }}
                      />
                    ) : (
                      <FaEnvelope
                        style={{ marginRight: "15px", color: "#0f1728" }}
                      />
                    )}
                  </>
                ),
              }}
              sx={{
                "& .MuiInputBase-input": {
                  color: "#333",
                  fontFamily: "Raleway, sans-serif",
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "#B0B0B0",
                  fontSize: "12px",
                },
                "& .MuiInput-underline:after": {
                  borderBottomColor: "#0f1728",
                },
                "& .MuiInput-underline:before": {
                  borderBottomColor: "#B0B0B0",
                },
                "& .MuiFormLabel-root": {
                  fontFamily: "Raleway-Bold, sans-serif",
                },
              }}
              placeholder="Enter your email or phone number"
            />

            <TextField
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <FaLock style={{ marginRight: "15px", color: "#0f1728" }} />
                ),
              }}
              sx={{
                "& .MuiInputBase-input": {
                  color: "#333",
                  fontFamily: "Raleway, sans-serif",
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "#B0B0B0",
                  fontSize: "12px",
                },
                "& .MuiInput-underline:after": {
                  borderBottomColor: "#0f1728",
                },
                "& .MuiInput-underline:before": {
                  borderBottomColor: "#B0B0B0",
                },
                "& .MuiFormLabel-root": {
                  fontFamily: "Raleway-Bold, sans-serif",
                },
              }}
              placeholder="Enter your password (if using email)"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="#0f1728"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1,
                color: "#fff",
                backgroundColor: "#0f1728",
                textTransform: "none",
                fontFamily: "Raleway, sans-serif",
                borderRadius: "10px",
                "&:hover": {
                  backgroundColor: "rgba(15, 23, 40, 0.9)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  transform: "scale(1.01)",
                },
                "&:disabled": {
                  backgroundColor: "#cccccc",
                  color: "#666666",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          

          <Dialog
            open={resetDialogOpen}
            onClose={() => setResetDialogOpen(false)}
            sx={{
              "& .MuiDialog-paper": {
                padding: "20px",
                borderRadius: "15px",
              },
            }}
          >
            <DialogTitle sx={{ fontFamily: "Raleway, sans-serif" }}>
              Reset Password
            </DialogTitle>
            <DialogContent>
              {resetSuccess ? (
                <Typography sx={{ fontFamily: "Raleway, sans-serif" }}>
                  Password reset email sent to {resetEmail}. Please check your
                  inbox.
                </Typography>
              ) : (
                <>
                  <Typography sx={{ mb: 2, fontFamily: "Raleway, sans-serif" }}>
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    sx={{
                      "& .MuiInputBase-input": {
                        fontFamily: "Raleway, sans-serif",
                      },
                    }}
                  />
                </>
              )}
            </DialogContent>
            <DialogActions>
              {!resetSuccess && (
                <>
                  <Button
                    onClick={() => setResetDialogOpen(false)}
                    sx={{ fontFamily: "Raleway, sans-serif" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleResetPassword}
                    color="primary"
                    sx={{ fontFamily: "Raleway, sans-serif" }}
                  >
                    Send Reset Link
                  </Button>
                </>
              )}
              {resetSuccess && (
                <Button
                  onClick={() => setResetDialogOpen(false)}
                  color="primary"
                  sx={{ fontFamily: "Raleway, sans-serif" }}
                >
                  Close
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </Box>
  );
};

export default DriverSignIn;
