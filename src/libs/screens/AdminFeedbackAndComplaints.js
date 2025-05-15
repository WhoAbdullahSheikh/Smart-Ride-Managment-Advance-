import React, { useState, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
  Badge,
} from "@mui/material";
import {
  FaRegComment,
  FaExclamationTriangle,
  FaSearch,
  FaCheck,
  FaTimes,
  FaUser,
  FaCalendarAlt,
  FaEnvelope,
  FaThumbsUp,
  FaThumbsDown,
  FaBroom,
  FaCarCrash,
  FaTools,
  FaInfoCircle,
} from "react-icons/fa";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

const AdminFeedbackAndComplaints = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load feedbacks
        const feedbacksQuery = query(
          collection(db, "feedbacks"),
          orderBy("date", "desc")
        );
        const feedbacksSnapshot = await getDocs(feedbacksQuery);
        const allFeedbacks = feedbacksSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: parseFirestoreDate(data.date),
          };
        });
        setFeedbacks(allFeedbacks);

        // Load complaints
        const complaintsQuery = query(
          collection(db, "complaints"),
          orderBy("date", "desc")
        );
        const complaintsSnapshot = await getDocs(complaintsQuery);
        const allComplaints = complaintsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: parseFirestoreDate(data.date),
          };
        });
        setComplaints(allComplaints);
      } catch (error) {
        console.error("Error loading data:", error);
        setSnackbar({
          open: true,
          message: "Failed to load data: " + error.message,
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const parseFirestoreDate = (dateValue) => {
    if (!dateValue) return new Date();

    if (typeof dateValue.toDate === "function") {
      return dateValue.toDate();
    }

    if (dateValue instanceof Date) {
      return dateValue;
    }

    if (typeof dateValue === "string") {
      const fixedDateString = dateValue.replace(/AZ$/, "Z");
      return new Date(fixedDateString);
    }

    console.warn("Could not parse date:", dateValue);
    return new Date();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUpdateStatus = async (type, id, newStatus) => {
    try {
      setLoading(true);
      const docRef = doc(
        db,
        type === "feedback" ? "feedbacks" : "complaints",
        id
      );
      await updateDoc(docRef, {
        status: newStatus,
      });

      if (type === "feedback") {
        setFeedbacks(
          feedbacks.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
      } else {
        setComplaints(
          complaints.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
      }

      setSnackbar({
        open: true,
        message: "Status updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update status",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(
    (feedback) =>
      feedback.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredComplaints = complaints.filter(
    (complaint) =>
      complaint.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "warning";
      case "resolved":
        return "success";
      case "rejected":
        return "error";
      case "submitted":
        default:
        return "info";
    }
  };

  const getComplaintIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "cleanliness":
        return <FaBroom />;
      case "safety":
        return <FaCarCrash />;
      case "service":
        return <FaTools />;
      default:
        return <FaInfoCircle />;
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        <FaRegComment style={{ marginRight: 10 }} />
        Feedback & Complaints Management
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider", flexGrow: 1 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable">
            <Tab
              label={
                <Badge badgeContent={feedbacks.length} color="primary">
                  Feedbacks
                </Badge>
              }
              icon={<FaRegComment style={{ marginRight: 8 }} />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab
              label={
                <Badge badgeContent={complaints.length} color="error">
                  Complaints
                </Badge>
              }
              icon={<FaExclamationTriangle style={{ marginRight: 8 }} />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </Box>

        <TextField
          variant="outlined"
          placeholder="Search feedbacks/complaints..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <FaSearch style={{ marginRight: 8, color: "#777" }} />
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        {activeTab === 0 ? (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaRegComment /> Showing {filteredFeedbacks.length} feedbacks
            </Typography>

            {filteredFeedbacks.length > 0 ? (
              <Paper elevation={2} sx={{ borderRadius: 2 }}>
                <List>
                  {filteredFeedbacks.map((feedback, index) => (
                    <React.Fragment key={feedback.id}>
                      <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <FaUser />
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {feedback.text}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Box component="span" display="flex" alignItems="center" gap={1} mt={0.5}>
                                <FaEnvelope size={12} />
                                <Typography component="span" variant="body2">
                                  {feedback.userEmail}
                                </Typography>
                              </Box>
                              <Box component="span" display="flex" alignItems="center" gap={1}>
                                <FaCalendarAlt size={12} />
                                <Typography component="span" variant="body2">
                                  {feedback.date.toLocaleString()}
                                </Typography>
                              </Box>
                            </>
                          }
                        />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                          <Chip
                            label={feedback.status}
                            color={getStatusColor(feedback.status)}
                            size="small"
                            icon={
                              feedback.status.toLowerCase() === "resolved" ? (
                                <FaThumbsUp size={14} />
                              ) : feedback.status.toLowerCase() === "rejected" ? (
                                <FaThumbsDown size={14} />
                              ) : null
                            }
                          />
                          {feedback.status.toLowerCase() === "submitted" && (
                            <>
                              <Button
                                variant="outlined"
                                color="success"
                                size="small"
                                startIcon={<FaCheck />}
                                onClick={() =>
                                  handleUpdateStatus(
                                    "feedback",
                                    feedback.id,
                                    "resolved"
                                  )
                                }
                                disabled={loading}
                                sx={{ textTransform: 'none' }}
                              >
                                Resolve
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<FaTimes />}
                                onClick={() =>
                                  handleUpdateStatus(
                                    "feedback",
                                    feedback.id,
                                    "rejected"
                                  )
                                }
                                disabled={loading}
                                sx={{ textTransform: 'none' }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </Box>
                      </ListItem>
                      {index < filteredFeedbacks.length - 1 && <Divider variant="inset" />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            ) : (
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <FaRegComment size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                <Typography variant="body1" color="textSecondary">
                  No feedbacks found
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaExclamationTriangle /> Showing {filteredComplaints.length} complaints
            </Typography>

            {filteredComplaints.length > 0 ? (
              <Paper elevation={2} sx={{ borderRadius: 2 }}>
                <List>
                  {filteredComplaints.map((complaint, index) => (
                    <React.Fragment key={complaint.id}>
                      <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                        <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                          {getComplaintIcon(complaint.type)}
                        </Avatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {complaint.text}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Box component="span" display="flex" alignItems="center" gap={1} mt={0.5}>
                                <FaEnvelope size={12} />
                                <Typography component="span" variant="body2">
                                  {complaint.userEmail}
                                </Typography>
                              </Box>
                              <Box component="span" display="flex" alignItems="center" gap={1}>
                                <FaCalendarAlt size={12} />
                                <Typography component="span" variant="body2">
                                  {complaint.date.toLocaleString()}
                                </Typography>
                              </Box>
                              {complaint.type && (
                                <Box component="span" display="flex" alignItems="center" gap={1}>
                                  <FaInfoCircle size={12} />
                                  <Typography component="span" variant="body2">
                                    Type: {complaint.type}
                                  </Typography>
                                </Box>
                              )}
                            </>
                          }
                        />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                          <Chip
                            label={complaint.status}
                            color={getStatusColor(complaint.status)}
                            size="small"
                            icon={
                              complaint.status.toLowerCase() === "resolved" ? (
                                <FaThumbsUp size={14} />
                              ) : complaint.status.toLowerCase() === "rejected" ? (
                                <FaThumbsDown size={14} />
                              ) : null
                            }
                          />
                          {complaint.status.toLowerCase() === "pending" && (
                            <>
                              <Button
                                variant="outlined"
                                color="success"
                                size="small"
                                startIcon={<FaCheck />}
                                onClick={() =>
                                  handleUpdateStatus(
                                    "complaint",
                                    complaint.id,
                                    "resolved"
                                  )
                                }
                                disabled={loading}
                                sx={{ textTransform: 'none' }}
                              >
                                Resolve
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<FaTimes />}
                                onClick={() =>
                                  handleUpdateStatus(
                                    "complaint",
                                    complaint.id,
                                    "rejected"
                                  )
                                }
                                disabled={loading}
                                sx={{ textTransform: 'none' }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </Box>
                      </ListItem>
                      {index < filteredComplaints.length - 1 && <Divider variant="inset" />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            ) : (
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <FaExclamationTriangle size={48} style={{ color: '#ccc', marginBottom: 16 }} />
                <Typography variant="body1" color="textSecondary">
                  No complaints found
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          iconMapping={{
            success: <FaCheck />,
            error: <FaTimes />,
            warning: <FaExclamationTriangle />,
            info: <FaInfoCircle />
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminFeedbackAndComplaints;