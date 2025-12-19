import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Typography, Grid, Paper, Alert, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [charityStatus, setCharityStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCharityStatus = async () => {
      try {
        const { data } = await api.get('/charities/profile');
        setCharityStatus(data.data.verificationStatus);
      } catch (error) {
        console.error('Failed to fetch charity status');
      } finally {
        setLoading(false);
      }
    };

    fetchCharityStatus();
  }, []);

  if (loading) {
    return <Container maxWidth="lg" sx={{ mt: 4 }}><Typography>Loading...</Typography></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Charity Dashboard
      </Typography>

      {charityStatus === 'pending' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Application Under Review</Typography>
          <Typography variant="body2">
            Your charity application is currently being reviewed by our admin team. 
            You will be able to create opportunities and access all features once your application is approved. 
            We typically review applications within 2-3 business days.
          </Typography>
        </Alert>
      )}

      {charityStatus === 'rejected' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Application Rejected</Typography>
          <Typography variant="body2">
            Unfortunately, your charity application was not approved. Please contact support for more information.
          </Typography>
        </Alert>
      )}

      {charityStatus === 'approved' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            ✓ Your charity is approved! You can now create opportunities and manage volunteers.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              component={Link} 
              to="/charity/opportunities/create"
              size="small"
            >
              Create Opportunity
            </Button>
            <Button 
              variant="outlined" 
              component={Link} 
              to="/charity/opportunities"
              size="small"
            >
              Manage Opportunities
            </Button>
          </Box>
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Active Opportunities</Typography>
            <Typography variant="h3" color="primary">0</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Applications</Typography>
            <Typography variant="h3" color="primary">0</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Total Volunteers</Typography>
            <Typography variant="h3" color="primary">0</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">Rating</Typography>
            <Typography variant="h3" color="primary">0.0</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
