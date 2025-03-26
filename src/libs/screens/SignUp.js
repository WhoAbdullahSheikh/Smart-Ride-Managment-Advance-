import React, { useState } from "react";
import GoogleAuth from "../auth/GoogleAuth";
import { TextField, Button, Typography, Container, Box, Snackbar, Alert } from "@mui/material";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { Link } from "react-router-dom";
import backgroundImage from "../../assets/images/img.jpg";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false); // To control Snackbar visibility
  const [snackbarMessage, setSnackbarMessage] = useState(""); // Snackbar message
  const [snackbarSeverity, setSnackbarSeverity] = useState("error"); // Snackbar severity

  const handleEmailSignUp = (e) => {
    e.preventDefault();
    setError("");

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        const userRef = doc(db, "email", user.uid);

        setDoc(userRef, {
          userData: {
            email: user.email,
            createdAt: new Date(),
          },
          signUpMethods: arrayUnion("Email/Password"),
        })
          .then(() => {
            console.log("Email user data saved to Firestore:", user.uid);
          })
          .catch((error) => {
            console.error("Error saving data to Firestore:", error);
          });

        console.log("User signed up:", user);
        setSnackbarMessage("Successfully signed up!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      })
      .catch((error) => {
        console.error("Error signing up:", error);
        setSnackbarMessage(error.message);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      });
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false); // Close the Snackbar when it's dismissed
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
        padding: "0", // Remove padding to prevent unwanted scrolling space
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
      {/* Snackbar for error or success messages */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }} // Position at the top of the page
        sx={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10, // Ensures it's above other elements
        }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Container
        component="main"
        maxWidth="xs"
        sx={{
          display: "flex",
          justifyContent: "center",
          position: "fixed",  // Fix the container in place
          top: "50%",   // Center vertically
          left: "50%",  // Center horizontally
          transform: "translate(-50%, -50%)",  // Center precisely
          zIndex: 1, // Ensure it's above the background
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
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <FaEnvelope style={{ marginRight: "15px", color: "#0f1728" }} />
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
              Sign Up
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: "center", width: "100%" }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Or
            </Typography>
            <GoogleAuth />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography
              variant="body2"
              style={{ fontFamily: "Raleway, sans-serif" }}
            >
              Already have an account?{" "}
              <Link
                to="/signin"
                style={{
                  color: "#0f1728",
                  textDecoration: "none",
                  fontFamily: "Raleway-Bold, sans-serif",
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default SignUp;
