import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@mui/material";
import { auth, db } from "../firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import GoogleLogo from "../../assets/svg/google.svg"; // Adjust the path to your SVG file

const GoogleAuth = () => {
  const handleLogin = () => {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
      .then((result) => {
        console.log("User signed in with Google:", result.user);

        const user = result.user;

        const userRef = doc(db, "google", user.uid);

        setDoc(userRef, {
          userData: {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date(),
          },
          signUpMethods: arrayUnion("Google"),
        })
          .then(() => {
            console.log("Google user data saved to Firestore:", user.uid);
          })
          .catch((error) => {
            console.error("Error saving data to Firestore:", error);
          });

      })
      .catch((error) => {
        console.error("Error during Google sign-in:", error.message);
      });
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
      Sign in with Google
    </Button>
  );
};

export default GoogleAuth;
