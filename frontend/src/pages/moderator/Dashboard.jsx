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
import { getReportStats } from '../../services/reportService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [reportStats, setReportStats] = useState({});
  const [loading, setLoading] = useState(true);
  // derive display name from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const getDisplayName = () => {
    const first = storedUser?.firstName || storedUser?.firstname || storedUser?.first_name || storedUser?.givenName || storedUser?.name;
    const last = storedUser?.lastName || storedUser?.lastname || storedUser?.last_name || storedUser?.familyName || '';
    const name = [first, last].filter(Boolean).join(' ');
    return name || null;
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await moderatorService.getDashboardStats();
      setStats(response.data);
      
      // Fetch report statistics
      const reportResponse = await getReportStats();
      setReportStats(reportResponse.data);
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
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" color={`${color}.main`} sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {title}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
        {action && (
          <Box sx={{ mt: 1 }}>
            <Button size="small" onClick={action.onClick} color={color} sx={{ p: 0.5, minHeight: 0, fontSize: '0.75rem' }}>
              {action.label}
            </Button>
          </Box>
        )}
      </CardContent>
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
          {getDisplayName() ? `Welcome, ${getDisplayName()}` : 'Moderator Dashboard'}
        </Typography>
        {/* <Typography variant="body2" color="text.secondary">
          Monitor and manage platform activities
        </Typography> */}
      </Box>
 {/* Recent Activity Alert */}
      {(stats.pendingCharityVerifications > 0 || stats.pendingVolunteerVerifications > 0 || reportStats.pendingReports > 0) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Attention Required:
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            {stats.pendingCharityVerifications > 0 && `${stats.pendingCharityVerifications} charity verification${stats.pendingCharityVerifications > 1 ? 's' : ''} pending. `}
            {stats.pendingVolunteerVerifications > 0 && `${stats.pendingVolunteerVerifications} volunteer verification${stats.pendingVolunteerVerifications > 1 ? 's' : ''} pending. `}
            {reportStats.pendingReports > 0 && `${reportStats.pendingReports} report${reportStats.pendingReports > 1 ? 's' : ''} awaiting review.`}
          </Typography>
        </Alert>
      )}

      {/* Additional info requested alert (navigates to user's application) */}
      {showAdditionalInfoAlert && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/volunteer/applications')}>
              Provide Info
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Additional Information Requested
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            An application requires additional information. Click the button to go to your application page and provide the requested details.
          </Typography>
        </Alert>
      )}
      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <ManageIcon color="primary" sx={{ fontSize: 32 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Manage Users</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                    Review charities and volunteers
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/moderator/management')}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Manage
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <AssessmentIcon color="secondary" sx={{ fontSize: 32 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Opportunities</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                    Manage published opportunities
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/moderator/opportunities')}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Manage
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <WarningIcon color="error" sx={{ fontSize: 32 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Reports</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                    Review flagged content
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/moderator/reports')}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Review
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Moderation Overview */}
      <Typography variant="h6" gutterBottom sx={{ mb: 1.5, mt: 2 }}>
        Moderation Overview
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6} sm={6} md={3}>
          <StatsCard
            title="Pending Reviews"
            value={(stats.pendingCharityVerifications || 0) + (stats.pendingVolunteerVerifications || 0)}
            icon={<WarningIcon sx={{ fontSize: 28 }} />}
            color="warning"
            action={{
              label: 'Review',
              onClick: () => navigate('/moderator/management')
            }}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatsCard
            title="Flagged Reports"
            value={reportStats.pendingReports || 0}
            icon={<WarningIcon sx={{ fontSize: 28 }} />}
            color="error"
            action={{
              label: 'Investigate',
              onClick: () => navigate('/moderator/reports')
            }}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatsCard
            title="Background Checks"
            value={stats.pendingBackgroundChecks || 0}
            icon={<VerifiedIcon sx={{ fontSize: 28 }} />}
            color="secondary"
            action={{
              label: 'Process',
              onClick: () => navigate('/moderator/management')
            }}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatsCard
            title="Reports Resolved"
            value={reportStats.resolvedReports || 0}
            icon={<VerifiedIcon sx={{ fontSize: 28 }} />}
            color="success"
          />
        </Grid>
      </Grid>
      {/* Platform Overview Stats */}
      <Typography variant="h6" gutterBottom sx={{ mb: 1.5, mt: 2 }}>
        Platform Statistics
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Platform Users */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Volunteers"
            value={stats.totalVolunteers || 0}
            icon={<GroupIcon />}
            color="success"
            action={{
              label: 'View All',
              onClick: () => navigate('/moderator/management')
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Charities"
            value={stats.totalCharities || 0}
            icon={<BusinessIcon />}
            color="primary"
            action={{
              label: 'View All',
              onClick: () => navigate('/moderator/management')
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Opportunities"
            value={stats.totalOpportunities || 0}
            icon={<AssessmentIcon />}
            color="info"
            action={{
              label: 'Manage',
              onClick: () => navigate('/moderator/opportunities')
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Volunteer Hours"
            value={`${stats.totalVolunteerHours || 0}h`}
            icon={<VerifiedIcon />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Engagement & Activity Stats */}
      <Typography variant="h6" gutterBottom sx={{ mb: 1.5, mt: 2 }}>
        Recent Activity & Engagement
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Applications This Month"
            value={stats.monthlyApplications || 0}
            icon={<AssessmentIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Completed Opportunities"
            value={stats.completedOpportunities || 0}
            icon={<VerifiedIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Active Applications"
            value={stats.activeApplications || 0}
            icon={<ManageIcon />}
            color="primary"
          />
        </Grid>
      </Grid>



     
    </Container>
  );
};

export default Dashboard;
