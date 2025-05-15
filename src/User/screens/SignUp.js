import React, { useState, useEffect } from "react";
import GoogleAuth from "../../user/auth/GoogleAuth";
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  Snackbar,
  Alert,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaIdCard,
  FaPhone,
  FaBirthdayCake,
  FaUserTie,
  FaMoneyBill,
} from "react-icons/fa";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, db } from "../../libs/firebase";
import {
  doc,
  setDoc,
  arrayUnion,
  getDocs,
  query,
  collection,
  where,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/images/login.png";
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
  const [step, setStep] = useState(1);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [cnic, setCnic] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("");
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (step === 2) {
          const isVerified = await checkEmailVerification(user);
          if (isVerified) {
            setStep(3);
          }
        }

        if (step === 1 || step === 2) {
          const userDoc = await getDoc(doc(db, "email", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data().userData;
            if (userData.status === "approved") {
              navigate("/dashboard");
            } else if (userData.status === "pending") {
              setStep(4);
            } else if (userData.emailVerified && !userData.status) {
              setStep(3);
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [step, navigate]);

  useEffect(() => {
    const loadPaymentSettings = async () => {
      const settings = await fetchPaymentSettings();
      setPaymentSettings(settings);
    };
    loadPaymentSettings();
  }, []);

  const isValidUsername = (username) => {
    const regex = /^(?=.*\d)[a-zA-Z0-9]+$/;
    return regex.test(username);
  };
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingProfile(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const userRef = doc(db, "email", user.uid);

      const profileData = {
        "userData.fatherName": fatherName,
        "userData.cnic": cnic,
        "userData.dob": dob,
        "userData.phone": phone,
        "userData.userType": userType,
        "userData.paymentMethod": paymentMethod,
        "userData.status": "pending",
        "userData.profileCompletedAt": serverTimestamp(),
      };

      if (profileImage) {
        profileData["userData.profileImage"] = profileImage;
      }

      await updateDoc(userRef, profileData);

      await signOut(auth);

      setStep(4);
    } catch (error) {
      console.error("Error submitting profile:", error);
      setSnackbarMessage("Error submitting profile. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsSubmittingProfile(false);
    }
  };
  const fetchPaymentSettings = async () => {
    try {
      const docRef = doc(db, "paymentSettings", "default");
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      return null;
    }
  };
  const getPaymentDetails = async (method) => {
    const settings = await fetchPaymentSettings();

    if (!settings) {
      switch (method) {
        case "monthly":
          return { monthly: 9500, total: 9500 * 4, installments: 4 };
        case "two_installments":
          return { monthly: 9000, total: 9000 * 2, installments: 2 };
        case "full_payment":
          return { monthly: 8500, total: 8500, installments: 1 };
        default:
          return { monthly: 0, total: 0, installments: 0 };
      }
    }

    switch (method) {
      case "monthly":
        return {
          monthly: settings.monthly.amount,
          total: settings.monthly.amount * settings.monthly.installments,
          installments: settings.monthly.installments,
        };
      case "two_installments":
        return {
          monthly: settings.two_installments.amount,
          total:
            settings.two_installments.amount *
            settings.two_installments.installments,
          installments: settings.two_installments.installments,
        };
      case "full_payment":
        return {
          monthly: settings.full_payment.amount,
          total: settings.full_payment.amount,
          installments: settings.full_payment.installments,
        };
      default:
        return { monthly: 0, total: 0, installments: 0 };
    }
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
          emailVerified: false,
          status: "unverified",
        },
        signUpMethods: arrayUnion("Email/Password"),
      });

      setSnackbarMessage(
        "Successfully signed up! Please check your email to verify your account."
      );
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setStep(2);

      const checkInterval = setInterval(async () => {
        const isVerified = await checkEmailVerification(user);
        if (isVerified) {
          clearInterval(checkInterval);
          setVerificationChecked(true);
          setSnackbarMessage("Email verified! Please complete your profile.");
          setSnackbarSeverity("success");
          setOpenSnackbar(true);
          setStep(3);
        }
      }, 5000);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!verificationChecked) {
          setSnackbarMessage(
            "Verification email sent. Please verify your email to continue."
          );
          setSnackbarSeverity("info");
          setOpenSnackbar(true);
        }
      }, 300000);
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
          "userData.emailVerified": true,
          "userData.status": "profile_pending",
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

  const renderSignUpForm = () => (
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
        <Link to="/signin" style={{ color: "#0f1728", textDecoration: "none" }}>
          Sign In
        </Link>
      </Typography>
    </Box>
  );

  const renderVerificationStep = () => (
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
        Verify Your Email
      </Typography>
      <Typography sx={{ mb: 3 }}>
        We've sent a verification email to <strong>{email}</strong>. Please
        check your inbox and click the verification link to continue.
      </Typography>
      <CircularProgress size={24} sx={{ mb: 3 }} />
      <Typography variant="body2" sx={{ mb: 2 }}>
        Didn't receive the email? Check your spam folder or
        <Button
          onClick={async () => {
            try {
              await sendEmailVerification(auth.currentUser);
              setSnackbarMessage("Verification email resent!");
              setSnackbarSeverity("success");
              setOpenSnackbar(true);
            } catch (error) {
              setSnackbarMessage("Error resending verification email");
              setSnackbarSeverity("error");
              setOpenSnackbar(true);
            }
          }}
          sx={{ ml: 1, textTransform: "none" }}
        >
          resend
        </Button>
      </Typography>
    </Box>
  );

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
        <Box
          sx={{
            mt: 2,
            mb: 2,
            width: "100%",
            textAlign: "center",
            // Add the imageUpload styles here directly
            "& .image-upload-area": {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed #0f1728",
              borderRadius: "50%",
              width: "100px",
              height: "100px",
              margin: "0 auto",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "rgba(15, 23, 40, 0.05)",
              },
            },
          }}
        >
          <Typography variant="body1" sx={{ mb: 1 }}>
            Profile Image
          </Typography>
          {imagePreview ? (
            <Box sx={{ position: "relative", display: "inline-block" }}>
              <img
                src={imagePreview}
                alt="Profile preview"
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #0f1728",
                }}
              />
              <Button
                onClick={handleRemoveImage}
                size="small"
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  minWidth: "auto",
                  padding: "4px",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.7)",
                  },
                }}
              >
                ×
              </Button>
            </Box>
          ) : (
            <label htmlFor="profile-image-upload" className="image-upload-area">
              <Button
                variant="outlined"
                component="span"
                sx={{
                  borderColor: "#0f1728",
                  color: "#0f1728",
                  "&:hover": {
                    borderColor: "rgba(15, 23, 40, 0.7)",
                  },
                }}
              >
                Upload Image
              </Button>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </label>
          )}
        </Box>
        <TextField
          required
          fullWidth
          label="Father's Name"
          value={fatherName}
          onChange={(e) => setFatherName(e.target.value)}
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
          value={cnic}
          onChange={(e) => setCnic(e.target.value)}
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
          value={dob}
          onChange={(e) => setDob(e.target.value)}
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
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
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
          value={paymentMethod}
          onChange={async (e) => {
            setPaymentMethod(e.target.value);
            const details = await getPaymentDetails(e.target.value);
            // You can store these details in state if needed
          }}
          margin="normal"
          InputProps={{
            startAdornment: (
              <FaMoneyBill style={{ marginRight: "15px", color: "#0f1728" }} />
            ),
          }}
        >
          <MenuItem value="monthly">
            Monthly (Rs {paymentSettings?.monthly?.amount || 9500} x{" "}
            {paymentSettings?.monthly?.installments || 4} = Rs{" "}
            {(paymentSettings?.monthly?.amount || 9500) *
              (paymentSettings?.monthly?.installments || 4)}
            )
          </MenuItem>
          <MenuItem value="two_installments">
            2 Installments (Rs{" "}
            {paymentSettings?.two_installments?.amount || 9000} x{" "}
            {paymentSettings?.two_installments?.installments || 2} = Rs{" "}
            {(paymentSettings?.two_installments?.amount || 9000) *
              (paymentSettings?.two_installments?.installments || 2)}
            )
          </MenuItem>
          <MenuItem value="full_payment">
            Full Payment (Rs {paymentSettings?.full_payment?.amount || 8500})
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
      <Box
        sx={{
          p: 3,
          backgroundColor: "#f5f5f5",
          borderRadius: 2,
          width: "100%",
        }}
      >
        <Typography variant="body2">
          <strong>Email:</strong> {email}
          <br />
          <strong>Status:</strong> Pending Approval
        </Typography>
      </Box>
      <Typography sx={{ mt: 3 }}>
        Need help?{" "}
        <Link to="/contact" style={{ color: "#0f1728" }}>
          Contact support
        </Link>
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
          {step === 1 && renderSignUpForm()}
          {step === 2 && renderVerificationStep()}
          {step === 3 && renderProfileForm()}
          {step === 4 && renderPendingApproval()}
        </Box>
      </Container>
    </Box>
  );
};

export default SignUp;
