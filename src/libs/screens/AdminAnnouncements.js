import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Snackbar, 
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { FaBullhorn, FaCalendarAlt, FaTrash, FaSave } from 'react-icons/fa';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useEffect } from 'react';

const AdminAnnouncements = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'announcements'));
        const announcementsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        }));
        setAnnouncements(announcementsData.sort((a, b) => b.date - a.date));
      } catch (error) {
        console.error('Error loading announcements:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load announcements',
          severity: 'error'
        });
      }
    };

    loadAnnouncements();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setSnackbar({
        open: true,
        message: 'Please fill all fields',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        content,
        date: new Date(),
        isActive: true
      });

      setTitle('');
      setContent('');
      setSnackbar({
        open: true,
        message: 'Announcement published successfully!',
        severity: 'success'
      });
      
      const querySnapshot = await getDocs(collection(db, 'announcements'));
      const announcementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));
      setAnnouncements(announcementsData.sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error('Error submitting announcement:', error);
      setSnackbar({
        open: true,
        message: 'Failed to publish announcement',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements(announcements.filter(ann => ann.id !== id));
      setSnackbar({
        open: true,
        message: 'Announcement deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete announcement',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        color: '#2d3748'
      }}>
        <FaBullhorn /> Announcement Management
      </Typography>

      <Paper elevation={3} sx={{ 
        p: 3, 
        mb: 4,
        borderRadius: 3,
        borderLeft: '4px solid #4f46e5',
        background: '#f8fafc'
      }}>
        <Typography variant="h6" gutterBottom sx={{ 
          fontWeight: 'bold',
          color: '#4f46e5',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          Create New Announcement
        </Typography>

        <TextField
          fullWidth
          label="Title"
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Content"
          variant="outlined"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FaSave />}
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            borderRadius: 2,
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            '&:hover': {
              background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)'
            }
          }}
        >
          Publish Announcement
        </Button>
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 2
      }}>
        Recent Announcements
      </Typography>

      {announcements.length > 0 ? (
        <Paper elevation={2} sx={{ borderRadius: 3 }}>
          <List>
            {announcements.map((announcement, index) => (
              <React.Fragment key={announcement.id}>
                <ListItem sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  py: 3
                }}>
                  <Box sx={{ 
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {announcement.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={announcement.date.toLocaleDateString()}
                        size="small"
                        icon={<FaCalendarAlt size={14} />}
                        sx={{ borderRadius: 1 }}
                      />
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<FaTrash />}
                        onClick={() => handleDelete(announcement.id)}
                        sx={{ borderRadius: 2 }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#4b5563' }}>
                    {announcement.content}
                  </Typography>
                </ListItem>
                {index < announcements.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: 3,
          border: '1px dashed #cbd5e1'
        }}>
          <FaBullhorn size={48} color="#cbd5e1" />
          <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
            No announcements yet. Create your first announcement!
          </Typography>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminAnnouncements;