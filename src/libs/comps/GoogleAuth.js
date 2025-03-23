// src/libs/comps/GoogleAuth.js
import React from 'react';
import { auth } from '../firebase'; // Import the initialized auth object from firebase.js
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@mui/material';

const GoogleAuth = () => {
  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    
    signInWithPopup(auth, provider)  // Use the initialized auth object
      .then((result) => {
        console.log(result.user);  // Log the user info on success
      })
      .catch((error) => {
        console.error(error.message);  // Log error message on failure
      });
  };

  return (
    <Button onClick={handleLogin} variant="contained" color="primary">
      Sign in with Google
    </Button>
  );
};

export default GoogleAuth;
