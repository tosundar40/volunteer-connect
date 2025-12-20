import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  CircularProgress,
  Tab,
  Tabs,
  Stack,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  Star as StarIcon,
  Check as ConfirmIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WorkIcon from '@mui/icons-material/Work';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import volunteerService from '../../services/volunteerService';
import applicationService from '../../services/applicationService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [volunteerId, setVolunteerId] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [committedHours, setCommittedHours] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Show alert when any application requests additional info
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        setError('User not authenticated');
        return;
      }

      // First get volunteer profile to get volunteerId and approvalStatus
      const profileResponse = await volunteerService.getMyProfile();
      const volId = profileResponse.data.id;
      const status = profileResponse.data.approvalStatus;
      setVolunteerId(volId);
      setApprovalStatus(status);

      // Fetch stats and applications in parallel
      const [statsResponse, applicationsResponse] = await Promise.all([
        volunteerService.getStats(volId),
        applicationService.getMyApplications()
      ]);

      setStats(statsResponse.data);

      // applicationsResponse.data may be an array or an object { applications: [...] } or { items: [...] }
      const appsPayload = applicationsResponse?.data;
      const apps = Array.isArray(appsPayload)
        ? appsPayload
        : (appsPayload?.applications || appsPayload?.items || []);
      setApplications(apps);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };





  // Confirmation handlers (move confirm participation here)


  const filterApplicationsByStatus = (status) => {
    if (status === 'all') return applications;
    if (status === 'pending') return applications.filter(app => ['pending', 'under_review'].includes(app.status));
    if (status === 'confirmed') return applications.filter(app => app.status === 'confirmed');
    if (status === 'past') {
      return applications.filter(app => 
        ['completed', 'rejected', 'cancelled'].includes(app.status) ||
        (app.opportunity && new Date(app.opportunity.endDate) < new Date())
      );
    }
    return applications;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'under_review': return 'info';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };
  const showAdditionalInfoAlert = (
    applications.some(app => app?.status === 'additional_info_requested' || app?.additionalInfoRequested === true) ||
    Boolean(
      stats?.pendingAdditionalInfoRequests ||
      stats?.pending_additional_info_requests ||
      stats?.additionalInfoRequested ||
      stats?.hasAdditionalInfoRequests
    )
  );


  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading dashboard...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchDashboardData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  const pendingCount = applications.filter(app => ['pending', 'under_review'].includes(app.status)).length;
  const confirmedCount = applications.filter(app => app.status === 'confirmed').length;
  const completedCount = stats?.totalOpportunitiesCompleted || 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      
      <Typography variant="h4" gutterBottom>
        Volunteer Dashboard
      </Typography>
      
      {/* Pending Approval Alert */}
      {approvalStatus === 'pending' && (
        <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Your Approval is Pending
          </Typography>
          <Typography variant="body2">
            Your profile is under review by our moderators. Once approved, you will be able to apply for volunteering opportunities. Please wait for approval notification.
          </Typography>
        </Alert>
      )}
      
      {/* Additional info requested alert (navigates to applications list) */}
      {showAdditionalInfoAlert && (
        <Alert
          severity="info"
          sx={{ mt: 2, mb: 2 }}
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
            One or more applications require additional information. Click the button to go to your applications and provide the requested details.
          </Typography>
        </Alert>
      )}
      {applications.some(app => app.status === 'approved') && (
        <Alert
          severity="info"
          sx={{ mt: 2, mb: 2 }}
          action={
            <Button color="inherit" size="small"  onClick={() => navigate('/volunteer/applications')}>
             Go to MyApplications
            </Button>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            You have approved applications awaiting confirmation
          </Typography>
          <Typography variant="body2">
            Please confirm your participation for the approved opportunity.
          </Typography>
        </Alert>
      )}
      
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PendingIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">{pendingCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid> */}
        {/* <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">{confirmedCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Confirmed</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid> */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">{stats?.totalHoursVolunteered || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Hours Volunteered</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">{completedCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Opportunities Completed</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

 
      {/* My Applications Section */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label={`All Applications (${applications.length})`} />
            <Tab label={`Pending (${pendingCount})`} />
            <Tab label={`Confirmed (${confirmedCount})`} />
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          {filterApplicationsByStatus(
            activeTab === 0 ? 'all' : 
            activeTab === 1 ? 'pending' : 
            activeTab === 2 ? 'confirmed' : 'past'
          ).length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No applications found
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {filterApplicationsByStatus(
                activeTab === 0 ? 'all' : 
                activeTab === 1 ? 'pending' : 
                activeTab === 2 ? 'confirmed' : 'past'
              ).map((application) => (
                <Grid item xs={12} key={application.id}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box flex={1}>
                                  <Typography variant="h6">
                                    {application.opportunity?.title || 'Opportunity'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {application.opportunity?.charity?.organizationName || 'Charity'}
                                  </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip 
                              label={application.status.replace('_', ' ').toUpperCase()} 
                              size="small" 
                              color={getStatusColor(application.status)}
                            />
                            {application.isSystemMatched && (
                              <Chip label="Recommended" size="small" color="info" icon={<StarIcon />} />
                            )}
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/volunteer/application-workflow/${application.id}`)}
                          >
                            View Details
                          </Button>
                        
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Browse Opportunities Section */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <StarIcon color="primary" />
            Find Your Perfect Opportunity
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Discover meaningful volunteer opportunities tailored to your skills and interests
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/opportunities')}
            sx={{ px: 4, py: 1.5 }}
          >
            Browse Opportunities
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
