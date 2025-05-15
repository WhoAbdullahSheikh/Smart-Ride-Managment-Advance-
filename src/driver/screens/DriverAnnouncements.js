import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button
} from '@mui/material';
import { FaBullhorn, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const DriverAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const q = query(
          collection(db, 'announcements'),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const announcementsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate()
        }));
        setAnnouncements(announcementsData.filter(ann => ann.isActive));
        setLoading(false);
      } catch (error) {
        console.error('Error loading announcements:', error);
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (selectedAnnouncement) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<FaArrowLeft />}
          onClick={() => setSelectedAnnouncement(null)}
          sx={{ mb: 2 }}
        >
          Back to announcements
        </Button>

        <Paper elevation={3} sx={{ 
          p: 4, 
          borderRadius: 3,
          borderLeft: '4px solid #4f46e5'
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 'bold',
            mb: 2,
            color: '#2d3748'
          }}>
            {selectedAnnouncement.title}
          </Typography>

          <Chip
            label={selectedAnnouncement.date.toLocaleDateString()}
            icon={<FaCalendarAlt size={14} />}
            sx={{ mb: 3, borderRadius: 1 }}
          />

          <Typography variant="body1" sx={{ 
            lineHeight: 1.8,
            fontSize: '1.1rem',
            color: '#4b5563'
          }}>
            {selectedAnnouncement.content}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        color: '#2d3748',
        mb: 3
      }}>
        <FaBullhorn /> Announcements
      </Typography>

      {announcements.length > 0 ? (
        <Paper elevation={2} sx={{ borderRadius: 3 }}>
          <List>
            {announcements.map((announcement, index) => (
              <React.Fragment key={announcement.id}>
                <ListItem 
                  button 
                  onClick={() => setSelectedAnnouncement(announcement)}
                  sx={{ 
                    py: 3,
                    '&:hover': {
                      backgroundColor: '#f8fafc'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {announcement.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography 
                          component="span" 
                          display="block" 
                          sx={{ mt: 1, color: '#4b5563' }}
                        >
                          {announcement.content.length > 100 
                            ? `${announcement.content.substring(0, 100)}...` 
                            : announcement.content}
                        </Typography>
                        <Chip
                          label={announcement.date.toLocaleDateString()}
                          size="small"
                          icon={<FaCalendarAlt size={14} />}
                          sx={{ mt: 1, borderRadius: 1 }}
                        />
                      </>
                    }
                  />
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
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            No announcements yet
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Check back later for updates
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DriverAnnouncements;