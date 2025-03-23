import React, { useState } from "react";
import GoogleAuth from "../auth/GoogleAuth";
import { TextField, Button, Typography, Container, Box } from "@mui/material";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
      })
      .catch((error) => {
        console.error("Error signing up:", error);
        setError(error.message);
      });
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        display: "flex",
        justifyContent: "center",
        height: "70vh",
        paddingTop: "100px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "30px",
          boxShadow: 5,
        }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 2, fontFamily: "Raleway, sans-serif", fontWeight: "bold" }}
        >
          Sign Up
        </Typography>

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

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
      </Box>
    </Container>
  );
};

export default SignUp;