import React, { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Button } from "@mui/material";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import GoogleLogo from "../../assets/svg/google.svg";
import { useNavigate } from "react-router-dom";
import { serverTimestamp } from "firebase/firestore";
import {
  TextField,
  Typography,
  Box,
  MenuItem,
  CircularProgress,
  Link,
} from "@mui/material";
import {
  FaUser,
  FaIdCard,
  FaPhone,
  FaBirthdayCake,
  FaUserTie,
  FaMoneyBill,
} from "react-icons/fa";

const GoogleAuth = ({
  openSnackbar,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity,
  setStep,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [step, setLocalStep] = useState(1);
  const [profileData, setProfileData] = useState({
    fatherName: "",
    cnic: "",
    dob: "",
    phone: "",
    userType: "",
    paymentMethod: "",
  });

  const checkEmailExists = async (email) => {
    try {
      const emailQuery = query(
        collection(db, "email"),
        where("userData.email", "==", email)
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      const googleQuery = query(
        collection(db, "google"),
        where("userData.email", "==", email)
      );
      const googleSnapshot = await getDocs(googleQuery);

      return !emailSnapshot.empty || !googleSnapshot.empty;
    } catch (error) {
      console.error("Error checking email existence:", error);
      return false;
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const userRef = doc(db, "google", user.uid);
      
      await updateDoc(userRef, {
        "userData.fatherName": profileData.fatherName,
        "userData.cnic": profileData.cnic,
        "userData.dob": profileData.dob,
        "userData.phone": profileData.phone,
        "userData.userType": profileData.userType,
        "userData.paymentMethod": profileData.paymentMethod,
        "userData.status": "pending",
        "userData.profileCompletedAt": serverTimestamp()
      });
      
      await signOut(auth);
      
      setLocalStep(3);
      setStep && setStep(3);
    } catch (error) {
      console.error("Error submitting profile:", error);
      setSnackbarMessage("Error submitting profile. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const renderProfileForm = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 2, fontFamily: "Raleway, sans-serif" }}
      >
        Complete Your Profile
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
        Please provide additional information for account verification.
      </Typography>

      <form onSubmit={handleProfileSubmit} style={{ width: "100%" }}>
        <TextField
          required
          fullWidth
          label="Father's Name"
          name="fatherName"
          value={profileData.fatherName}
          onChange={handleProfileChange}
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
            "& .MuiInput-underline:after": {
              borderBottomColor: "#0f1728",
            },
          }}
        />

        <TextField
          required
          fullWidth
          label="CNIC"
          name="cnic"
          value={profileData.cnic}
          onChange={handleProfileChange}
          margin="normal"
          InputProps={{
            startAdornment: (
              <FaIdCard style={{ marginRight: "15px", color: "#0f1728" }} />
            ),
          }}
          placeholder="XXXXX-XXXXXXX-X"
          sx={{
            "& .MuiInputBase-input": {
              color: "#333",
              fontFamily: "Raleway, sans-serif",
            },
            "& .MuiInput-underline:after": {
              borderBottomColor: "#0f1728",
            },
          }}
        />

        <TextField
          required
          fullWidth
          label="Date of Birth"
          type="date"
          name="dob"
          value={profileData.dob}
          onChange={handleProfileChange}
          margin="normal"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <FaBirthdayCake
                style={{ marginRight: "15px", color: "#0f1728" }}
              />
            ),
          }}
          sx={{
            "& .MuiInputBase-input": {
              color: "#333",
              fontFamily: "Raleway, sans-serif",
            },
            "& .MuiInput-underline:after": {
              borderBottomColor: "#0f1728",
            },
          }}
        />

        <TextField
          required
          fullWidth
          label="Phone Number"
          name="phone"
          value={profileData.phone}
          onChange={handleProfileChange}
          margin="normal"
          InputProps={{
            startAdornment: (
              <FaPhone style={{ marginRight: "15px", color: "#0f1728" }} />
            ),
          }}
          sx={{
            "& .MuiInputBase-input": {
              color: "#333",
              fontFamily: "Raleway, sans-serif",
            },
            "& .MuiInput-underline:after": {
              borderBottomColor: "#0f1728",
            },
          }}
        />

        <TextField
          required
          fullWidth
          select
          label="User Type"
          name="userType"
          value={profileData.userType}
          onChange={handleProfileChange}
          margin="normal"
          InputProps={{
            startAdornment: (
              <FaUserTie style={{ marginRight: "15px", color: "#0f1728" }} />
            ),
          }}
          sx={{
            "& .MuiInputBase-input": {
              color: "#333",
              fontFamily: "Raleway, sans-serif",
            },
            "& .MuiInput-underline:after": {
              borderBottomColor: "#0f1728",
            },
          }}
        >
          <MenuItem value="faculty">Faculty</MenuItem>
          <MenuItem value="staff">Staff</MenuItem>
          <MenuItem value="student">Student</MenuItem>
        </TextField>

        <TextField
          required
          fullWidth
          select
          label="Payment Method"
          name="paymentMethod"
          value={profileData.paymentMethod}
          onChange={handleProfileChange}
          margin="normal"
          InputProps={{
            startAdornment: (
              <FaMoneyBill style={{ marginRight: "15px", color: "#0f1728" }} />
            ),
          }}
          sx={{
            "& .MuiInputBase-input": {
              color: "#333",
              fontFamily: "Raleway, sans-serif",
            },
            "& .MuiInput-underline:after": {
              borderBottomColor: "#0f1728",
            },
          }}
        >
          <MenuItem value="monthly">Monthly (Rs 9,500 x 4 = 38,000)</MenuItem>
          <MenuItem value="two_installments">
            2 Installments (Rs 9,000 x 4 = 36,000)
          </MenuItem>
          <MenuItem value="full_payment">
            Full Payment (Rs 8,500 x 4 = 34,000)
          </MenuItem>
        </TextField>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="#0f1728"
          disabled={isSubmittingProfile}
          sx={{
            mt: 3,
            py: 1,
            color: "#fff",
            backgroundColor: "#0f1728",
            textTransform: "none",
            borderRadius: "10px",
            fontFamily: "Raleway, sans-serif",
            "&:hover": {
              backgroundColor: "rgba(15, 23, 40, 0.9)",
            },
            "&:disabled": {
              backgroundColor: "#cccccc",
              color: "#666666",
            },
          }}
        >
          {isSubmittingProfile ? "Submitting..." : "Submit Profile"}
        </Button>
      </form>
    </Box>
  );

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
      <Typography
        variant="h4"
        sx={{ mb: 2, fontFamily: "Raleway, sans-serif" }}
      >
        Account Pending Approval
      </Typography>
      <Typography sx={{ mb: 3 }}>
        Thank you for completing your profile. Your account is now pending
        approval by the administrator.
      </Typography>
      <Typography sx={{ mb: 3 }}>
        You'll receive an email notification once your account has been
        approved. This process typically takes 1-2 business days.
      </Typography>
      <Typography sx={{ mt: 3 }}>
        Need help?{" "}
        <Link to="/contact" style={{ color: "#0f1728" }}>
          Contact support
        </Link>
      </Typography>
    </Box>
  );

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const emailExists = await checkEmailExists(user.email);
      if (emailExists) {
        setSnackbarMessage("This email is already registered. Please sign in instead.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }

      const userRef = doc(db, "google", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        await setDoc(userRef, {
          userData: {
            email: user.email,
            displayName: user.displayName,
            username: user.displayName.replace(/\s+/g, "").toLowerCase(),
            createdAt: serverTimestamp(),
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            status: "profile_pending",
          },
          signUpMethods: ["Google"],
        });

        // Move to profile form step
        setLocalStep(2);
        setStep && setStep(3); // Update parent component's step if needed
      } else {
        const userData = userSnapshot.data().userData;
        if (userData.status === "approved") {
          navigate("/dashboard");
        } else if (userData.status === "pending") {
          setLocalStep(3);
          setStep && setStep(4);
        } else if (userData.emailVerified && !userData.status) {
          setLocalStep(2);
          setStep && setStep(3);
        }
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      setSnackbarMessage("An error occurred during Google sign-in.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return renderProfileForm();
  }

  if (step === 3) {
    return renderPendingApproval();
  }

  return (
    <Button
      onClick={handleLogin}
      variant="contained"
      fullWidth
      disabled={loading}
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
      {loading ? (
        <CircularProgress size={24} color="inherit" />
      ) : (
        <>
          <img
            src={GoogleLogo}
            alt="Google logo"
            style={{ marginRight: "10px", width: "20px", height: "20px" }}
          />
          Continue with Google
        </>
      )}
    </Button>
  );
};

export default GoogleAuth;