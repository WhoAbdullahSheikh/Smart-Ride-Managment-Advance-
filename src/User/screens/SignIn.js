import React, { useState, useEffect } from "react";
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
  Divider,
} from "@mui/material";
import { UAParser } from "ua-parser-js";
import { FaEnvelope, FaLock, FaUserShield } from "react-icons/fa";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "../../libs/firebase";
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
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getDeviceInfo = () => {
    const parser = new UAParser();
    const result = parser.getResult();
    return {
      type: result.device.type || 'desktop',
      model: result.device.model || 'unknown',
      os: result.os.name || 'unknown',
      browser: result.browser.name || 'unknown'
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const emailUserRef = doc(db, "email", user.uid);
          const emailUserDoc = await getDoc(emailUserRef);
          
          if (emailUserDoc.exists()) {
            const userData = emailUserDoc.data().userData || emailUserDoc.data();
            setStatus(userData.status);
            
            if (userData.status === "pending") {
              await signOut(auth);
            } else if (userData.status === "approved") {
              handleSuccessfulLogin(user, userData, emailUserRef);
            }
          }
        } catch (error) {
          console.error("Error checking user status:", error);
        }
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  const handleSuccessfulLogin = async (user, userData, userRef) => {
    const loginActivity = {
      timestamp: new Date().toISOString(),
      device: {
        type: getDeviceInfo().type,
        model: getDeviceInfo().model,
        os: getDeviceInfo().os,
        browser: getDeviceInfo().browser,
      },
      ip: await fetch("https://api.ipify.org?format=json")
        .then((response) => response.json())
        .then((data) => data.ip)
        .catch(() => "IP not available"),
    };
    
    await updateDoc(userRef, {
      loginActivities: arrayUnion(loginActivity),
    });

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
        emailVerified: true,
      })
    );

    setSnackbarMessage("Successfully logged in!");
    setSnackbarSeverity("success");
    setOpenSnackbar(true);

    setTimeout(() => {
      navigate("/userdashboard");
    }, 2000);
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    // Validate inputs
    if (!email || !password) {
      setSnackbarMessage("Please enter both email and password");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setLoading(false);
      return;
    }

    // Validate email format if it's not a phone number
    const isPhoneNumber = /^\+?[0-9]{10,15}$/.test(email);
    if (!isPhoneNumber && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSnackbarMessage("Please enter a valid email address");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setLoading(false);
      return;
    }
  
    try {
      if (isPhoneNumber) {
        // Handle phone number login
        const driversQuery = query(
          collection(db, "drivers"),
          where("userData.phone", "==", email)
        );
        const querySnapshot = await getDocs(driversQuery);

        if (querySnapshot.empty) {
          throw new Error("No driver found with this phone number");
        }

        const driverDoc = querySnapshot.docs[0];
        const driverData = driverDoc.data();

        // Sign in with the email associated with this phone number
        const userCredential = await signInWithEmailAndPassword(
          auth,
          driverData.email,
          password
        );
        const user = userCredential.user;

        const loginActivity = {
          timestamp: new Date().toISOString(),
          device: getDeviceInfo(),
          ip: await fetch("https://api.ipify.org?format=json")
            .then((response) => response.json())
            .then((data) => data.ip)
            .catch(() => "IP not available"),
        };

        await updateDoc(doc(db, "drivers", user.uid), {
          loginActivities: arrayUnion(loginActivity),
        });

        sessionStorage.setItem(
          "driver",
          JSON.stringify({
            ...driverData,
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || driverData.displayName,
          })
        );

        setSnackbarMessage("Successfully logged in as driver!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);

        setTimeout(() => {
          navigate("/driverdashboard");
        }, 2000);
      } else {
        // Handle email login
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

        // Check both collections in parallel
        const [emailUserDoc, driverUserDoc] = await Promise.all([
          getDoc(doc(db, "email", user.uid)),
          getDoc(doc(db, "drivers", user.uid)),
        ]);

        if (emailUserDoc.exists()) {
          // User found in email collection
          const userData = emailUserDoc.data().userData || emailUserDoc.data();
          setStatus(userData.status);

          if (userData.status === "pending") {
            await auth.signOut();
            return;
          }

          if (!userData.emailVerified) {
            await updateDoc(doc(db, "email", user.uid), {
              "userData.emailVerified": true,
            });
          }

          await handleSuccessfulLogin(user, userData, doc(db, "email", user.uid));
          navigate("/userdashboard");
        } else if (driverUserDoc.exists()) {
          // User found in drivers collection
          const driverData = driverUserDoc.data();

          const loginActivity = {
            timestamp: new Date().toISOString(),
            device: getDeviceInfo(),
            ip: await fetch("https://api.ipify.org?format=json")
              .then((response) => response.json())
              .then((data) => data.ip)
              .catch(() => "IP not available"),
          };

          await updateDoc(doc(db, "drivers", user.uid), {
            loginActivities: arrayUnion(loginActivity),
          });

          sessionStorage.setItem(
            "driver",
            JSON.stringify({
              ...driverData,
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || driverData.displayName,
            })
          );

          setSnackbarMessage("Successfully logged in as driver!");
          setSnackbarSeverity("success");
          setOpenSnackbar(true);

          setTimeout(() => {
            navigate("/driverdashboard");
          }, 2000);
        } else {
          await auth.signOut();
          throw new Error("Account not found in database");
        }
      }
    } catch (error) {
      console.error("Error signing in:", error);
      setLoading(false);

      let errorMessage = "Error during sign-in. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/invalid-email":
            errorMessage = "Invalid email format";
            break;
          case "auth/user-disabled":
            errorMessage = "This account has been disabled";
            break;
          case "auth/user-not-found":
            errorMessage = "No account found with this email";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password";
            break;
          case "auth/network-request-failed":
            errorMessage = "Network error. Please check your connection";
            break;
          default:
            errorMessage = error.message || "Authentication failed";
        }
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
    if (!resetEmail) {
      setSnackbarMessage("Please enter your email address");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setSnackbarMessage("Please enter a valid email address");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

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

  const renderPendingApproval = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        width: "100%",
      }}
    >
      <Typography variant="h4" sx={{ mb: 2, fontFamily: "Raleway, sans-serif" }}>
        Account Pending Approval
      </Typography>
      <Typography sx={{ mb: 3 }}>
        Your account is currently pending approval by the administrator.
      </Typography>
      <Typography sx={{ mb: 3 }}>
        You'll receive an email notification once your account has been approved. 
        This process typically takes 1-2 business days.
      </Typography>
      <Box sx={{ p: 3, backgroundColor: '#f5f5f5', borderRadius: 2, width: '100%' }}>
        <Typography variant="body2">
          <strong>Email:</strong> {email}<br />
          <strong>Status:</strong> Pending Approval
        </Typography>
      </Box>
      <Typography sx={{ mt: 3 }}>
        Need help? <Link to="/contact" style={{ color: "#0f1728" }}>Contact support</Link>
      </Typography>
    </Box>
  );

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
          {status === "pending" ? (
            renderPendingApproval()
          ) : (
            <>
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
                  label="Email Address or Phone Number"
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
                  placeholder="Enter your password"
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
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

              <Divider sx={{ width: '100%', my: 3 }}>Or</Divider>

              <Button
                onClick={handleGoogleSignIn}
                fullWidth
                variant="contained"
                color="#0f1728"
                sx={{
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

              <Box sx={{ mt: 3, width: '100%', textAlign: 'center' }}>
                <Button
                  component={Link}
                  to="/driversignin"
                  fullWidth
                  variant="outlined"
                  startIcon={<FaUserShield />}
                  sx={{
                    py: 1,
                    color: "#0f1728",
                    borderColor: "#0f1728",
                    textTransform: "none",
                    fontFamily: "Raleway, sans-serif",
                    borderRadius: "10px",
                    "&:hover": {
                      backgroundColor: "rgba(15, 23, 40, 0.1)",
                      borderColor: "#0f1728",
                    },
                  }}
                >
                  Driver Sign In
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
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default SignIn;