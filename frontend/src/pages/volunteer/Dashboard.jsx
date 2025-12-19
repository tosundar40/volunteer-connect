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
  Stack
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
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const [volunteerId, setVolunteerId] = useState(null);
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

      // First get volunteer profile to get volunteerId
      const profileResponse = await volunteerService.getMyProfile();
      const volId = profileResponse.data.id;
      setVolunteerId(volId);

      // Fetch stats and recommendations in parallel
      const [statsResponse, recommendationsResponse, applicationsResponse] = await Promise.all([
        volunteerService.getStats(volId),
        volunteerService.getRecommendations(volId),
        applicationService.getMyApplications()
      ]);

      setStats(statsResponse.data);
      setRecommendations(recommendationsResponse.data || []);

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

  const getMatchColor = (score) => {
    if (score >= 70) return 'success';
    if (score >= 50) return 'info';
    if (score >= 30) return 'warning';
    return 'error';
  };

  const getMatchLabel = (score) => {
    if (score >= 70) return 'Excellent Match';
    if (score >= 50) return 'Good Match';
    if (score >= 30) return 'Fair Match';
    return 'Poor Match';
  };

  const getFactorColor = (score) => {
    if (score >= 18) return 'success';
    if (score >= 10) return 'info';
    if (score >= 5) return 'warning';
    return 'error';
  };

  const renderFactorIcon = (factor) => {
    const key = factor.toLowerCase();
    if (key.includes('skill')) return <BuildIcon fontSize="small" />;
    if (key.includes('interest') || key.includes('category')) return <FavoriteIcon fontSize="small" />;
    if (key.includes('location')) return <LocationIcon fontSize="small" />;
    if (key.includes('availability')) return <ScheduleIcon fontSize="small" />;
    if (key.includes('experience')) return <WorkIcon fontSize="small" />;
    if (key.includes('demograph') || key.includes('age')) return <AccessibilityNewIcon fontSize="small" />;
    return <StarIcon fontSize="small" />;
  };

  const handleApplyToOpportunity = (opportunityId) => {
    navigate(`/opportunities/${opportunityId}`);
  };

  const handleViewOpportunity = (opportunityId) => {
    navigate(`/opportunities/${opportunityId}`);
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
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.50' }}>
            <PendingIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">Pending</Typography>
            <Typography variant="h3" color="primary">{pendingCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.50' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">Confirmed</Typography>
            <Typography variant="h3" color="success.main">{confirmedCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.50' }}>
            <ScheduleIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">Hours Volunteered</Typography>
            <Typography variant="h3" color="info.main">{stats?.totalHoursVolunteered || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.50' }}>
            <TrendingUpIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" color="text.secondary">Completed</Typography>
            <Typography variant="h3" color="warning.main">{completedCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', '&:hover': { boxShadow: 3 } }} 
                 onClick={() => navigate('/volunteer/attendance')}>
            <HistoryIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Attendance History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View your participation records and provide feedback
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', '&:hover': { boxShadow: 3 } }}
                 onClick={() => navigate('/opportunities')}>
            <WorkIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Find Opportunities
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Discover new volunteering opportunities
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', '&:hover': { boxShadow: 3 } }}
                 onClick={() => navigate('/volunteer/applications')}>
            <PendingIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              My Applications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your application status
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* My Applications Section */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label={`All Applications (${applications.length})`} />
            <Tab label={`Pending (${pendingCount})`} />
            <Tab label={`Confirmed (${confirmedCount})`} />
            <Tab label="Past" />
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
                    <CardContent>
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

      {/* Recommended Opportunities */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon color="primary" />
          Recommended Opportunities for You
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Based on your skills, interests, and location
        </Typography>
        
        {recommendations.length === 0 ? (
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary" textAlign="center">
              Complete your profile to get personalized opportunity recommendations.
            </Typography>
            <Box textAlign="center" mt={2}>
              <Button variant="contained" onClick={() => navigate('/volunteer/profile')}>
                Complete Profile
              </Button>
            </Box>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {recommendations.map((rec) => {
              const opportunity = rec.opportunity;
              const matchScore = rec.matchScore?.score || rec.matchScore || 0;
              const matchDetails = rec.matchDetails || null;
              
              return (
                <Grid item xs={12} md={6} key={opportunity.id}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                          {opportunity.title}
                        </Typography>
                        <Chip
                          label={`${matchScore}%`}
                          color={getMatchColor(matchScore)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Stack>
                      
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={matchScore} 
                          color={getMatchColor(matchScore)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {getMatchLabel(matchScore)}
                        </Typography>
                      </Box>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        {opportunity.description?.substring(0, 150)}...
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Stack spacing={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {opportunity.locationType === 'virtual' ? 'Virtual' : 
                             `${opportunity.city}, ${opportunity.state}`}
                          </Typography>
                        </Box>
                        {opportunity.category && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <CategoryIcon fontSize="small" color="action" />
                            <Typography variant="body2">{opportunity.category}</Typography>
                          </Box>
                        )}
                        {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Required Skills:</Typography>
                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                              {opportunity.requiredSkills.slice(0, 3).map((skill, idx) => (
                                <Chip key={idx} label={skill} size="small" variant="outlined" />
                              ))}
                              {opportunity.requiredSkills.length > 3 && (
                                <Chip label={`+${opportunity.requiredSkills.length - 3}`} size="small" />
                              )}
                            </Stack>
                          </Box>
                        )}
                      </Stack>

                      {matchDetails?.factors && matchDetails.factors.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box>
                                <Typography variant="subtitle2">Match Breakdown</Typography>
                                <Typography variant="caption" color="text.secondary">{matchDetails.recommendation}</Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Stack spacing={1}>
                                {matchDetails.factors.map((f, idx) => (
                                  <Box key={idx} display="flex" justifyContent="space-between" alignItems="center">
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      {renderFactorIcon(f.factor)}
                                      <Typography variant="body2">{f.factor}</Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Chip label={`${Math.round(f.score)} pts`} size="small" color={getFactorColor(f.score)} />
                                      <Typography variant="caption" color="text.secondary">{f.details}</Typography>
                                    </Stack>
                                  </Box>
                                ))}
                              </Stack>
                            </AccordionDetails>
                          </Accordion>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => handleViewOpportunity(opportunity.id)}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleApplyToOpportunity(opportunity.id)}
                      >
                        Apply Now
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;
