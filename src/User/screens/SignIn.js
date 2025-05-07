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
} from "@mui/material";
import { UAParser } from 'ua-parser-js';
import { FaEnvelope, FaLock } from "react-icons/fa";
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { auth } from "../../libs/firebase";
import { arrayUnion, updateDoc } from "firebase/firestore";
import backgroundImage from "../../assets/images/login.png";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../libs/firebase";
import GoogleLogo from "../../assets/svg/google.svg";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [resetEmail, setResetEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const parser = new UAParser();
    const result = parser.getResult();
    
    let deviceInfo = {
      type: 'Unknown',
      model: 'Unknown',
      os: 'Unknown',
      browser: 'Unknown'
    };
  
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
      deviceInfo.type = 'Mobile';
      if (/Android/.test(userAgent)) deviceInfo.type = 'Android';
      if (/iPhone|iPad|iPod/.test(userAgent)) deviceInfo.type = 'iOS';
    } else {
      deviceInfo.type = 'Desktop';
      if (/Windows/.test(userAgent)) deviceInfo.type = 'Windows PC';
      if (/Mac/.test(userAgent)) deviceInfo.type = 'Mac';
      if (/Linux/.test(userAgent)) deviceInfo.type = 'Linux PC';
    }
  
    if (result.device.model) {
      deviceInfo.model = result.device.model;
    }
    
    if (result.os.name) {
      deviceInfo.os = `${result.os.name} ${result.os.version || ''}`.trim();
    }
    
    if (result.browser.name) {
      deviceInfo.browser = `${result.browser.name} ${result.browser.version || ''}`.trim();
    }
  
    return deviceInfo;
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
  
      if (!user.emailVerified) {
        await auth.signOut();
        throw new Error("Please verify your email before signing in.");
      }
  
      const emailUserRef = doc(db, "email", user.uid);
      const emailUserDoc = await getDoc(emailUserRef);
  
      if (!emailUserDoc.exists()) {
        await auth.signOut();
        throw new Error("Account not found in database");
      }
  
      if (!emailUserDoc.data().userData?.emailVerified) {
        await updateDoc(emailUserRef, {
          "userData.emailVerified": true
        });
      }
  
      const loginActivity = {
        timestamp: new Date().toISOString(),
        device: {
          type: getDeviceInfo().type,
          model: getDeviceInfo().model,
          os: getDeviceInfo().os,
          browser: getDeviceInfo().browser
        },
        ip: await fetch('https://api.ipify.org?format=json')
          .then(response => response.json())
          .then(data => data.ip)
          .catch(() => 'IP not available')
      };
      await updateDoc(emailUserRef, {
        loginActivities: arrayUnion(loginActivity),
      });
  
      const userData = emailUserDoc.data().userData || emailUserDoc.data();
  
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          ...userData,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || userData.displayName,
          createdAt: userData.createdAt || {
            seconds: Math.floor(Date.now() / 1000),
          },
          emailVerified: true
        })
      );
  
      setSnackbarMessage("Successfully logged in!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
  
      setTimeout(() => {
        navigate("/userdashboard");
      }, 2000);
    } catch (error) {
      console.error("Error signing in:", error);
  
      let errorMessage = "Error during sign-in. Please try again.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "This account does not exist.";
      } else if (error.message === "Account not found in database") {
        errorMessage = "Account does not exist.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.message === "Please verify your email before signing in.") {
        errorMessage = error.message;
      }
  
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "google", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const loginActivity = {
          timestamp: new Date().toISOString(),
          device: getDeviceInfo(),
          ip: await fetch("https://api.ipify.org?format=json")
            .then((response) => response.json())
            .then((data) => data.ip)
            .catch(() => "IP not available"),
        };

        await updateDoc(userRef, {
          loginActivities: arrayUnion(loginActivity),
        });

        const userData = userSnapshot.data().userData || userSnapshot.data();

        sessionStorage.setItem(
          "user",
          JSON.stringify({
            ...userData,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: userData.createdAt || {
              seconds: Math.floor(Date.now() / 1000),
            },
          })
        );

        setSnackbarMessage("Successfully logged in with Google!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);

        setTimeout(() => {
          navigate("/userdashboard");
        }, 2000);
      } else {
        await auth.signOut();
        setSnackbarMessage("This Google account is not registered.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      setSnackbarMessage("Error during Google sign-in. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleForgotPassword = () => {
    setResetDialogOpen(true);
    setResetSuccess(false);
    setResetEmail(email);
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
            Sign In
          </Typography>

          <form onSubmit={handleEmailSignIn} style={{ width: "100%" }}>
            <TextField
              required
              fullWidth
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <FaEnvelope
                    style={{ marginRight: "15px", color: "#0f1728" }}
                  />
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
              placeholder="Enter your email"
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
              placeholder="Enter your password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="#0f1728"
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
              }}
            >
              Sign In
            </Button>
          </form>

          <Box sx={{ width: "100%", textAlign: "right", mt: 1 }}>
            <Button
              onClick={handleForgotPassword}
              sx={{
                textTransform: "none",
                color: "#0f1728",
                fontFamily: "Raleway, sans-serif",
                fontSize: "0.875rem",
                "&:hover": {
                  textDecoration: "underline",
                  backgroundColor: "transparent",
                },
              }}
            >
              Forgot Password?
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: "center", width: "100%" }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Or
            </Typography>
            <Button
              onClick={handleGoogleSignIn}
              fullWidth
              variant="contained"
              color="#0f1728"
              sx={{
                mt: 2,
                py: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
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
              }}
            >
              <img
                src={GoogleLogo}
                alt="Google logo"
                style={{ marginRight: "10px", width: "20px", height: "20px" }}
              />
              Continue with Google
            </Button>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography
              variant="body2"
              style={{ fontFamily: "Raleway, sans-serif" }}
            >
              Don't have an account?{" "}
              <Link
                to="/signup"
                style={{
                  color: "#0f1728",
                  textDecoration: "none",
                  fontFamily: "Raleway-Bold, sans-serif",
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>

          {/* Forgot Password Dialog */}
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
                  Password reset email sent to {resetEmail}. Please check your inbox.
                </Typography>
              ) : (
                <>
                  <Typography sx={{ mb: 2, fontFamily: "Raleway, sans-serif" }}>
                    Enter your email address and we'll send you a link to reset your password.
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

export default SignIn;