import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../libs/firebase';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Grid
} from '@mui/material';
import { FaMoneyBillWave } from 'react-icons/fa';

const PaymentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [paymentSettings, setPaymentSettings] = useState({
    monthly: { amount: 9500, installments: 4 },
    two_installments: { amount: 9000, installments: 2 },
    full_payment: { amount: 8500, installments: 1 }
  });

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const docRef = doc(db, 'paymentSettings', 'default');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setPaymentSettings(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
        setSnackbar({ open: true, message: 'Error loading payment settings', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentSettings();
  }, []);

  const handleChange = (method, field, value) => {
    setPaymentSettings(prev => ({
      ...prev,
      [method]: {
        ...prev[method],
        [field]: Number(value)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'paymentSettings', 'default'), paymentSettings);
      setSnackbar({ open: true, message: 'Payment settings saved successfully', severity: 'success' });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      setSnackbar({ open: true, message: 'Error saving payment settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FaMoneyBillWave size={32} style={{ marginRight: 16, color: '#1976d2' }} />
          <Typography variant="h4">Payment Settings</Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Monthly Installments</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount per installment"
                type="number"
                value={paymentSettings.monthly.amount}
                onChange={(e) => handleChange('monthly', 'amount', e.target.value)}
                InputProps={{ startAdornment: 'Rs ' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of installments"
                type="number"
                value={paymentSettings.monthly.installments}
                onChange={(e) => handleChange('monthly', 'installments', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Two Installments</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount per installment"
                type="number"
                value={paymentSettings.two_installments.amount}
                onChange={(e) => handleChange('two_installments', 'amount', e.target.value)}
                InputProps={{ startAdornment: 'Rs ' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of installments"
                type="number"
                value={paymentSettings.two_installments.installments}
                onChange={(e) => handleChange('two_installments', 'installments', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Full Payment</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total amount"
                type="number"
                value={paymentSettings.full_payment.amount}
                onChange={(e) => handleChange('full_payment', 'amount', e.target.value)}
                InputProps={{ startAdornment: 'Rs ' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of installments"
                type="number"
                value={paymentSettings.full_payment.installments}
                onChange={(e) => handleChange('full_payment', 'installments', e.target.value)}
                disabled
              />
            </Grid>
          </Grid>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
          sx={{ mt: 2 }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentSettings;