import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      // Try to retrieve the user data from sessionStorage
      const userFromSession = JSON.parse(sessionStorage.getItem("user"));

      if (userFromSession) {
        setUserData(userFromSession);
        setLoading(false);
      } else {
        const user = auth.currentUser;

        if (user) {
          try {
            // First try the google collection
            const googleUserRef = doc(db, "google", user.uid);
            const googleUserDoc = await getDoc(googleUserRef);

            if (googleUserDoc.exists()) {
              setUserData(googleUserDoc.data().userData);
            } else {
              // If not found in google collection, try email collection
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

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
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
        }}
      >
        <Typography variant="h6">No profile data found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: "20px" }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, fontFamily: "Raleway-Bold, sans-serif" }}
      >
        User Profile
      </Typography>
      <Paper
        sx={{ padding: "20px", backgroundColor: "#fff", borderRadius: "8px" }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={3} textAlign="center">
            {/* Avatar: show photoURL if available, otherwise show the initial of the name */}
            <Avatar
              sx={{ width: 100, height: 100, margin: "0 auto" }}
              alt={userData.displayName}
              src={userData.photoURL || undefined}
            >
              {!userData.photoURL && userData.displayName
                ? userData.displayName[0]
                : ""}
            </Avatar>
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography
              variant="h6"
              sx={{ fontFamily: "Raleway-Bold, sans-serif" }}
            >
              Name:
            </Typography>
            <Typography variant="body1">{userData.displayName}</Typography>

            <Typography
              variant="h6"
              sx={{ fontFamily: "Raleway-Bold, sans-serif", mt: 2 }}
            >
              Username:
            </Typography>
            <Typography variant="body1">{userData.username}</Typography>

            <Typography
              variant="h6"
              sx={{ fontFamily: "Raleway-Bold, sans-serif", mt: 2 }}
            >
              Email:
            </Typography>
            <Typography variant="body1">{userData.email}</Typography>

            <Typography
              variant="h6"
              sx={{ fontFamily: "Raleway-Bold, sans-serif", mt: 2 }}
            >
              Member Since:
            </Typography>
            <Typography variant="body1">
              {userData.createdAt?.seconds
                ? new Date(
                    userData.createdAt.seconds * 1000
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profile;
