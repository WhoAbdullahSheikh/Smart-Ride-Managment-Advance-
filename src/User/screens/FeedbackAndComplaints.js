import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Badge
} from '@mui/material';
import { 
  FaPaperPlane, 
  FaRegComment, 
  FaExclamationTriangle,
  FaUser,
  FaCalendarAlt,
  FaThumbsUp,
  FaThumbsDown,
  FaCheckCircle,
  FaClock,
  FaBroom,
  FaCarAlt,
  FaUserShield,
  FaQuestionCircle,
  FaTimes,
  FaInfoCircle
} from 'react-icons/fa';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const FeedbackAndComplaints = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [feedbacks, setFeedbacks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadUserData(user.uid);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    try {
      // Load feedbacks
      const feedbacksQuery = query(
        collection(db, 'feedbacks'),
        where('userId', '==', userId)
      );
      const feedbacksSnapshot = await getDocs(feedbacksQuery);
      const userFeedbacks = feedbacksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().date)
      }));
      setFeedbacks(userFeedbacks.sort((a, b) => b.date - a.date));

      // Load complaints
      const complaintsQuery = query(
        collection(db, 'complaints'),
        where('userId', '==', userId)
      );
      const complaintsSnapshot = await getDocs(complaintsQuery);
      const userComplaints = complaintsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().date)
      }));
      setComplaints(userComplaints.sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error('Error loading user data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load your data',
        severity: 'error'
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter your feedback',
        severity: 'error'
      });
      return;
    }

    if (!user) {
      setSnackbar({
        open: true,
        message: 'You must be logged in to submit feedback',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        text: feedbackText,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Anonymous',
        date: new Date().toISOString(),
        status: 'submitted'
      });

      setFeedbackText('');
      setSnackbar({
        open: true,
        message: 'Thank you for your feedback!',
        severity: 'success'
      });
      loadUserData(user.uid);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit feedback',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintText.trim() || !complaintType.trim()) {
      setSnackbar({
        open: true,
        message: 'Please fill all fields',
        severity: 'error'
      });
      return;
    }

    if (!user) {
      setSnackbar({
        open: true,
        message: 'You must be logged in to submit a complaint',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'complaints'), {
        text: complaintText,
        type: complaintType,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Anonymous',
        date: new Date().toISOString(),
        status: 'pending'
      });

      setComplaintText('');
      setComplaintType('');
      setSnackbar({
        open: true,
        message: 'Complaint submitted successfully!',
        severity: 'success'
      });
      loadUserData(user.uid);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit complaint',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return <FaPaperPlane size={14} />;
      case 'pending':
        return <FaClock size={14} />;
      case 'resolved':
        return <FaCheckCircle size={14} />;
      case 'rejected':
        return <FaThumbsDown size={14} />;
      default:
        return <FaQuestionCircle size={14} />;
    }
  };

  const getComplaintIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'punctuality':
        return <FaClock />;
      case 'cleanliness':
        return <FaBroom />;
      case 'behavior':
        return <FaUser />;
      case 'safety':
        return <FaUserShield />;
      case 'vehicle cleanliness':
        return <FaCarAlt />;
      default:
        return <FaExclamationTriangle />;
    }
  };

  return (
    <Box sx={{ 
      p: 3, 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
      minHeight: '100vh'
    }}>
      <Paper elevation={3} sx={{ 
        p: 4, 
        mb: 4, 
        borderRadius: 4,
        background: 'white',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h4" gutterBottom sx={{ 
          fontWeight: 'bold', 
          color: '#2d3748',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            {activeTab === 0 ? <FaRegComment size={24} /> : <FaExclamationTriangle size={24} />}
          </Box>
          Feedback & Complaints
        </Typography>
        
        {!user && (
          <Alert severity="warning" sx={{ 
            mb: 3,
            borderRadius: 2,
            background: '#fff3bf',
            color: '#5f3dc4'
          }}>
            Please sign in to submit feedback or complaints
          </Alert>
        )}
        
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          mb: 3
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: 2,
                backgroundColor: '#4f46e5'
              }
            }}
          >
            <Tab 
              label={
                <Badge badgeContent={feedbacks.length} color="primary" sx={{ mr: 1 }}>
                  <Typography sx={{ 
                    fontWeight: 'bold',
                    color: activeTab === 0 ? '#4f46e5' : '#718096'
                  }}>
                    Feedback
                  </Typography>
                </Badge>
              }
              icon={<FaRegComment style={{ 
                marginRight: 8,
                color: activeTab === 0 ? '#4f46e5' : '#718096'
              }} />}
              iconPosition="start"
              sx={{ 
                py: 2,
                textTransform: 'none',
                fontSize: '1rem'
              }}
            />
            <Tab 
              label={
                <Badge badgeContent={complaints.length} color="error" sx={{ mr: 1 }}>
                  <Typography sx={{ 
                    fontWeight: 'bold',
                    color: activeTab === 1 ? '#4f46e5' : '#718096'
                  }}>
                    Complaints
                  </Typography>
                </Badge>
              }
              icon={<FaExclamationTriangle style={{ 
                marginRight: 8,
                color: activeTab === 1 ? '#4f46e5' : '#718096'
              }} />}
              iconPosition="start"
              sx={{ 
                py: 2,
                textTransform: 'none',
                fontSize: '1rem'
              }}
            />
          </Tabs>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          {activeTab === 0 ? (
            <Box>
              <Paper elevation={0} sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 3,
                border: '2px dashed #c7d2fe',
                background: '#f8fafc'
              }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <FaRegComment /> Share Your Feedback
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="We'd love to hear your thoughts! Share your experience or suggestions..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#a5b4fc'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#4f46e5'
                      }
                    }
                  }}
                  disabled={!user}
                />
                <Button
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: 'white',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
                      boxShadow: '0 6px 8px rgba(79, 70, 229, 0.3)'
                    }
                  }}
                  startIcon={<FaPaperPlane />}
                  onClick={handleSubmitFeedback}
                  disabled={loading || !user}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Send Feedback'}
                </Button>
              </Paper>
              
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 'bold',
                color: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <FaRegComment /> Your Feedback History
              </Typography>
              {feedbacks.length > 0 ? (
                <Box sx={{
                  display: 'grid',
                  gap: 2
                }}>
                  {feedbacks.map((feedback) => (
                    <Paper key={feedback.id} elevation={0} sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      borderLeft: '4px solid #818cf8',
                      background: 'white',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: '#e0e7ff',
                          color: '#4f46e5'
                        }}>
                          <FaUser />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            {feedback.text}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                              label={feedback.status}
                              size="small"
                              icon={getStatusIcon(feedback.status)}
                              sx={{
                                background: feedback.status === 'submitted' ? '#e0e7ff' : 
                                           feedback.status === 'resolved' ? '#dcfce7' : 
                                           feedback.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                                color: feedback.status === 'submitted' ? '#4f46e5' : 
                                      feedback.status === 'resolved' ? '#166534' : 
                                      feedback.status === 'rejected' ? '#991b1b' : '#854d0e'
                              }}
                            />
                            <Typography variant="caption" color="textSecondary" sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              <FaCalendarAlt size={12} /> {feedback.date.toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Paper elevation={0} sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  borderRadius: 3,
                  background: '#f8fafc'
                }}>
                  <FaRegComment size={48} color="#c7d2fe" />
                  <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                    No feedback submitted yet. Your voice matters!
                  </Typography>
                </Paper>
              )}
            </Box>
          ) : (
            <Box>
              <Paper elevation={0} sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 3,
                border: '2px dashed #fecaca',
                background: '#fff5f5'
              }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <FaExclamationTriangle /> Report an Issue
                </Typography>
                <TextField
                  select
                  fullWidth
                  label="Issue Type"
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  SelectProps={{
                    native: true,
                  }}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#fca5a5'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#dc2626'
                      }
                    }
                  }}
                  disabled={!user}
                >
                  <option value=""></option>
                  <option value="Punctuality">Punctuality</option>
                  <option value="Vehicle Cleanliness">Vehicle Cleanliness</option>
                  <option value="Driver Behavior">Driver Behavior</option>
                  <option value="Safety Concern">Safety Concern</option>
                  <option value="Other">Other</option>
                </TextField>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Please describe the issue in detail..."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#fca5a5'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#dc2626'
                      }
                    }
                  }}
                  disabled={!user}
                />
                <Button
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                    color: 'white',
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(220, 38, 38, 0.2)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                      boxShadow: '0 6px 8px rgba(220, 38, 38, 0.3)'
                    }
                  }}
                  startIcon={<FaPaperPlane />}
                  onClick={handleSubmitComplaint}
                  disabled={loading || !user}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit Complaint'}
                </Button>
              </Paper>
              
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 'bold',
                color: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <FaExclamationTriangle /> Your Reported Issues
              </Typography>
              {complaints.length > 0 ? (
                <Box sx={{
                  display: 'grid',
                  gap: 2
                }}>
                  {complaints.map((complaint) => (
                    <Paper key={complaint.id} elevation={0} sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      borderLeft: '4px solid #fca5a5',
                      background: 'white',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: '#fee2e2',
                          color: '#dc2626'
                        }}>
                          {getComplaintIcon(complaint.type)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ mb: 1 }}>
                            {complaint.text}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                              label={complaint.type}
                              size="small"
                              sx={{
                                background: '#e0e7ff',
                                color: '#4f46e5'
                              }}
                            />
                            <Chip
                              label={complaint.status}
                              size="small"
                              icon={getStatusIcon(complaint.status)}
                              sx={{
                                background: complaint.status === 'pending' ? '#fef9c3' : 
                                           complaint.status === 'resolved' ? '#dcfce7' : 
                                           complaint.status === 'rejected' ? '#fee2e2' : '#e0e7ff',
                                color: complaint.status === 'pending' ? '#854d0e' : 
                                      complaint.status === 'resolved' ? '#166534' : 
                                      complaint.status === 'rejected' ? '#991b1b' : '#4f46e5'
                              }}
                            />
                            <Typography variant="caption" color="textSecondary" sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              <FaCalendarAlt size={12} /> {complaint.date.toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Paper elevation={0} sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  borderRadius: 3,
                  background: '#fff5f5'
                }}>
                  <FaExclamationTriangle size={48} color="#fca5a5" />
                  <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                    No complaints submitted yet. We're here to help if any issues arise.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '&.MuiAlert-standardSuccess': {
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              color: 'white'
            },
            '&.MuiAlert-standardError': {
              background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
              color: 'white'
            },
            '&.MuiAlert-standardWarning': {
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              color: 'white'
            },
            '&.MuiAlert-standardInfo': {
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              color: 'white'
            }
          }}
          iconMapping={{
            success: <FaThumbsUp />,
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

export default FeedbackAndComplaints;