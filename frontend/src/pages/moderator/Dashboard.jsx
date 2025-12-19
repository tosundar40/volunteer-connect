import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Grid, Card, CardContent, CardActions,
  Button, Box, Chip, Alert, CircularProgress, Paper, Stack
} from '@mui/material';
import {
  Business as BusinessIcon, Group as GroupIcon, 
  Warning as WarningIcon, VerifiedUser as VerifiedIcon,
  ManageAccounts as ManageIcon, Assessment as AssessmentIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { moderatorService } from '../../services/moderatorService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await moderatorService.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Show alert when additional info is requested for an application
  const showAdditionalInfoAlert = Boolean(
    stats?.status === 'ADDITIONAL_INFO_REQUESTED' ||
    stats?.additionalInfoRequested === true ||
    (stats?.pendingAdditionalInfoRequests && stats.pendingAdditionalInfoRequests > 0)
  );

  // Stats card component
  const StatsCard = ({ title, value, icon, color = 'primary', action }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
      {action && (
        <CardActions>
          <Button size="small" onClick={action.onClick} color={color}>
            {action.label}
          </Button>
        </CardActions>
      )}
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Moderator Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage platform activities
        </Typography>
      </Box>
 {/* Recent Activity Alert */}
      {(stats.pendingCharityVerifications > 0 || stats.pendingVolunteerVerifications > 0 || stats.flaggedApplications > 0) && (
        <Alert severity="warning" sx={{ mt: 3,mb: 4  }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Attention Required:
          </Typography>
          <Typography variant="body2">
            There are pending items requiring moderator review. Please check the management section.
          </Typography>
        </Alert>
      )}

      {/* Additional info requested alert (navigates to user's application) */}
      {showAdditionalInfoAlert && (
        <Alert
          severity="info"
          sx={{ mt: 3, mb: 4 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/volunteer/applications')}>
              Provide Info
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Additional Information Requested
          </Typography>
          <Typography variant="body2">
            An application requires additional information. Click the button to go to your application page and provide the requested details.
          </Typography>
        </Alert>
      )}
      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ManageIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">Manage Users</Typography>
                  <Typography variant="body2" color="text.secondary">
                    View, review, and manage charities and volunteers
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                onClick={() => navigate('/moderator/management')}
                fullWidth
              >
                Go to Management
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AssessmentIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">Application Reviews</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Review flagged applications and handle disputes
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
            <CardActions>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/moderator/applications')}
                fullWidth
              >
                Review Applications
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Stats Overview */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Platform Statistics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Charity Verifications"
            value={stats.pendingCharityVerifications || 0}
            icon={<BusinessIcon />}
            color="warning"
            action={{
              label: 'Review Charities',
              onClick: () => navigate('/moderator/management')
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Volunteer Verifications"
            value={stats.pendingVolunteerVerifications || 0}
            icon={<GroupIcon />}
            color="info"
            action={{
              label: 'Review Volunteers',
              onClick: () => navigate('/moderator/management')
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Flagged Applications"
            value={stats.flaggedApplications || 0}
            icon={<WarningIcon />}
            color="error"
            action={{
              label: 'Review Applications',
              onClick: () => navigate('/moderator/applications')
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Background Checks Pending"
            value={stats.pendingBackgroundChecks || 0}
            icon={<VerifiedIcon />}
            color="secondary"
            action={{
              label: 'Review Checks',
              onClick: () => navigate('/moderator/management')
            }}
          />
        </Grid>
      </Grid>

     
    </Container>
  );
};

export default Dashboard;
