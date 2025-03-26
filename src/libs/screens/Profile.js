// Profile.js
import React from "react";
import { Box, Typography } from "@mui/material";

const Profile = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontFamily: "Raleway-Bold, sans-serif" }}>
        User Profile
      </Typography>
      {/* Profile content goes here */}
    </Box>
  );
};

export default Profile;