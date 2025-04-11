import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@mui/material";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import GoogleLogo from "../../assets/svg/google.svg";
import { useNavigate } from "react-router-dom";
import { serverTimestamp } from "firebase/firestore";

const GoogleAuth = ({ openSnackbar, setOpenSnackbar, setSnackbarMessage, setSnackbarSeverity }) => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("User signed in with Google:", user);

      const userRef = doc(db, "google", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        console.log("Google user already exists in Firestore:", user.uid);

        setSnackbarMessage("This account is already linked with Google. Please sign in.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      } else {
        await setDoc(userRef, {
          userData: {
            email: user.email,
            name: user.displayName,
            username: user.displayName.replace(/\s+/g, "").toLowerCase(),
            createdAt: serverTimestamp(),
            photoURL: user.photoURL,
          },
          signUpMethods: ["Google"],
        });

        console.log("New Google user added to Firestore:", user.uid);

        setSnackbarMessage("Account created successfully! You can now sign in.");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);

        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      setSnackbarMessage("An error occurred during Google sign-in.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  return (
    <Button
      onClick={handleLogin}
      variant="contained"
      fullWidth
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
      <img src={GoogleLogo} alt="Google logo" style={{ marginRight: "10px", width: "20px", height: "20px" }} />
      Continue with Google
    </Button>
  );
};

export default GoogleAuth;
