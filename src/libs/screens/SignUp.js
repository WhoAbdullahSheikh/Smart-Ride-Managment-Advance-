import React, { useState } from "react";
import GoogleAuth from "../auth/GoogleAuth";
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { 
  createUserWithEmailAndPassword,
  sendEmailVerification 
} from "firebase/auth";
import { auth, db } from "../firebase";
import {
  doc,
  setDoc,
  arrayUnion,
  getDocs,
  query,
  collection,
  where,
  updateDoc
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/images/img.jpg";
import { serverTimestamp } from "firebase/firestore";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const isValidUsername = (username) => {
    const regex = /^(?=.*\d)[a-zA-Z0-9]+$/;
    return regex.test(username);
  };

  const checkIfUsernameExists = async (username) => {
    const emailQuery = query(
      collection(db, "email"),
      where("userData.username", "==", username)
    );
    const googleQuery = query(
      collection(db, "google"),
      where("userData.username", "==", username)
    );

    const emailSnapshot = await getDocs(emailQuery);
    const googleSnapshot = await getDocs(googleQuery);

    if (!emailSnapshot.empty || !googleSnapshot.empty) {
      return true;
    }

    return false;
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    if (!isValidUsername(username)) {
      setSnackbarMessage(
        "Username combination should be alphanumeric with at least one number."
      );
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setLoading(false);
      return;
    }
  
    const usernameExists = await checkIfUsernameExists(username);
    if (usernameExists) {
      setSnackbarMessage("Username already exists. Please choose another.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setLoading(false);
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
  
      await sendEmailVerification(user);
  
      const userRef = doc(db, "email", user.uid);
  
      await setDoc(userRef, {
        userData: {
          email: user.email,
          displayName: name,
          username: username,
          createdAt: serverTimestamp(),
          emailVerified: false
        },
        signUpMethods: arrayUnion("Email/Password"),
      });
  
      setSnackbarMessage(
        "Successfully signed up! Please check your email to verify your account."
      );
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
  
      const checkInterval = setInterval(async () => {
        const isVerified = await checkEmailVerification(user);
        if (isVerified) {
          clearInterval(checkInterval);
          setSnackbarMessage("Email verified! You can now sign in.");
          setSnackbarSeverity("success");
          setOpenSnackbar(true);
        }
      }, 5000);
  
      setTimeout(() => {
        clearInterval(checkInterval);
        navigate("/signin");
      }, 30000);
  
    } catch (error) {
      console.error("Error signing up:", error);
      let errorMessage = error.message;
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use. Please sign in instead.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      }
  
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailVerification = async (user) => {
    try {
      await user.reload();
      
      if (user.emailVerified) {
        const userRef = doc(db, "email", user.uid);
        await updateDoc(userRef, {
          "userData.emailVerified": true
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking email verification:", error);
      return false;
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
            Get Started
          </Typography>

          <form onSubmit={handleEmailSignUp} style={{ width: "100%" }}>
            <TextField
              required
              fullWidth
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
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
              placeholder="Enter your full name"
            />

            <TextField
              required
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <FaUser style={{ marginRight: "15px", color: "#0f1728" }} />
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
              placeholder="Enter your username"
            />

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

            <Typography
              variant="body2"
              sx={{
                mt: 1,
                fontSize: "0.75rem",
                color: "#666",
                textAlign: "center",
                fontFamily: "Raleway, sans-serif",
              }}
            >
              We'll send a verification email to activate your account.
            </Typography>

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
                fontFamily: "Raleway-Bold, sans-serif",
                borderRadius: "10px",
                fontFamily: "Raleway, sans-serif",
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
              {loading ? "Processing..." : "Sign Up"}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: "center", width: "100%" }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Or
            </Typography>
            <GoogleAuth
              openSnackbar={openSnackbar}
              setOpenSnackbar={setOpenSnackbar}
              setSnackbarMessage={setSnackbarMessage}
              setSnackbarSeverity={setSnackbarSeverity}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{
              mt: 2,
              textAlign: "center",
              fontFamily: "Raleway, sans-serif",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/signin"
              style={{ color: "#0f1728", textDecoration: "none" }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default SignUp;