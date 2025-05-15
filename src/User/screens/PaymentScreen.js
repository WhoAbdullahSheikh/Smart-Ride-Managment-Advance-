import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  useTheme,
  Grid,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import { FaMoneyBillWave, FaUser, FaCheckCircle } from "react-icons/fa";

const PaymentScreen = () => {
  const theme = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState({
    method: "",
    monthly: 0,
    total: 0,
    installments: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [emailDoc, googleDoc, paymentSettingsDoc] = await Promise.all([
          getDoc(doc(db, "email", user.uid)),
          getDoc(doc(db, "google", user.uid)),
          getDoc(doc(db, "paymentSettings", "default")),
        ]);

        const userDoc = emailDoc.exists()
          ? emailDoc
          : googleDoc.exists()
          ? googleDoc
          : null;
        const paymentSettings = paymentSettingsDoc.exists()
          ? paymentSettingsDoc.data()
          : null;

        if (userDoc) {
          const data = userDoc.data();
          const userData = data.userData || data;
          setUserData(userData);

          const method = userData.paymentMethod;
          if (method) {
            let details = {};

            if (paymentSettings) {
              switch (method) {
                case "monthly":
                  details = {
                    method: "Monthly Installments",
                    monthly: paymentSettings.monthly.amount,
                    total:
                      paymentSettings.monthly.amount *
                      paymentSettings.monthly.installments,
                    installments: paymentSettings.monthly.installments,
                  };
                  break;
                case "two_installments":
                  details = {
                    method: "2 Installments",
                    monthly: paymentSettings.two_installments.amount,
                    total:
                      paymentSettings.two_installments.amount *
                      paymentSettings.two_installments.installments,
                    installments: paymentSettings.two_installments.installments,
                  };
                  break;
                case "full_payment":
                  details = {
                    method: "Full Payment",
                    monthly: paymentSettings.full_payment.amount,
                    total: paymentSettings.full_payment.amount,
                    installments: paymentSettings.full_payment.installments,
                  };
                  break;
                default:
                  details = {
                    method: "Not Selected",
                    monthly: 0,
                    total: 0,
                    installments: 0,
                  };
              }
            } else {
              switch (method) {
                case "monthly":
                  details = {
                    method: "Monthly Installments",
                    monthly: 9500,
                    total: 38000,
                    installments: 4,
                  };
                  break;
                case "two_installments":
                  details = {
                    method: "2 Installments",
                    monthly: 9000,
                    total: 18000,
                    installments: 2,
                  };
                  break;
                case "full_payment":
                  details = {
                    method: "Full Payment",
                    monthly: 8500,
                    total: 8500,
                    installments: 1,
                  };
                  break;
                default:
                  details = {
                    method: "Not Selected",
                    monthly: 0,
                    total: 0,
                    installments: 0,
                  };
              }
            }

            setPaymentDetails(details);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!userData) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6">
          Please sign in to view payment information
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1800, mx: "auto", p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar
            src={userData.photoURL}
            sx={{
              width: 64,
              height: 64,
              mr: 3,
              bgcolor: theme.palette.primary.main,
            }}
          >
            {userData.displayName?.charAt(0) || <FaUser size={32} />}
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              Hello, {userData.displayName || "User"}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Payment Information
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                    color: theme.palette.primary.main,
                  }}
                >
                  <FaMoneyBillWave size={24} style={{ marginRight: 12 }} />
                  <Typography variant="h6">Payment Plan</Typography>
                </Box>

                <Typography variant="h6" sx={{ mb: 2 }}>
                  <strong>Selected Plan:</strong> {paymentDetails.method}
                </Typography>

                {paymentDetails.method !== "Not Selected" && (
                  <>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      <strong>Installments:</strong>{" "}
                      {paymentDetails.installments}
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      <strong>Per Installment:</strong> Rs{" "}
                      {paymentDetails.monthly.toLocaleString()}
                    </Typography>
                    <Typography variant="h6">
                      <strong>Total Amount:</strong> Rs{" "}
                      {paymentDetails.total.toLocaleString()}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                    color: theme.palette.success.main,
                  }}
                >
                  <FaCheckCircle size={24} style={{ marginRight: 12 }} />
                  <Typography variant="h6">Payment Summary</Typography>
                </Box>

                {paymentDetails.method === "Not Selected" ? (
                  <Typography variant="body1">
                    No payment plan selected yet. Please contact support.
                  </Typography>
                ) : (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      You have selected the{" "}
                      <strong>{paymentDetails.method}</strong> plan.
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Your total fee is{" "}
                      <strong>
                        Rs {paymentDetails.total.toLocaleString()}
                      </strong>
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1, marginTop: "20px" }}>
                      To pay your fee, please visit UTS Office at{" "}
                      <strong>
                        Capital University of Science & Technology, Islamabad
                        Expressway, Kahuta، Road Zone-V Sihala, Islamabad
                      </strong>
                    </Typography>
                    {paymentDetails.installments > 1 && (
                      <Typography variant="body1">
                        Payable in{" "}
                        <strong>{paymentDetails.installments}</strong>{" "}
                        installments of{" "}
                        <strong>
                          Rs {paymentDetails.monthly.toLocaleString()}
                        </strong>{" "}
                        each.
                      </Typography>
                    )}
                  </>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={paymentDetails.method === "Not Selected"}
                >
                  Thank You
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default PaymentScreen;
