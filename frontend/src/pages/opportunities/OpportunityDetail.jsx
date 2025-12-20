import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container, Typography, Paper, Box, Grid, Chip, Button, Divider,
  CircularProgress, IconButton, Card, CardContent, List, ListItem,
  ListItemText, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Rating
} from '@mui/material';
import { Tooltip } from '@mui/material';
import {
  LocationOn, Schedule, Group, Person, Email, Phone ,
  ArrowBack,  TrendingUp, Category, Business
  , Visibility
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import api, { BASE_URL } from '../../services/api';
import volunteerService from '../../services/volunteerService';

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchedVolunteers, setMatchedVolunteers] = useState(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [averageRating, setAverageRating] = useState({
    rating: 0,
    count: 0,
    loading: true
  });

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const { data } = await api.get(`/opportunities/${id}`);
        setOpportunity(data.data);
          // Fetch charity average rating after opportunity is loaded
          if (data.data?.charity?.id) {
            fetchCharityAverageRating(data.data.charity.id);
          }
      } catch (error) {
        toast.error('Failed to fetch opportunity details');
        navigate('/opportunities');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunity();
  }, [id, navigate]);
  const fetchCharityAverageRating = async (charityId) => {
    if (!charityId) {
      setAverageRating({ rating: 0, count: 0, loading: false });
      return;
    }

    try {
      const { data } = await api.get(`/attendance/charity/${charityId}/average-rating`);
      setAverageRating({
        rating: data.data.averageRating || 0,
        count: data.data.ratingCount || 0,
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch charity rating:', error);
      setAverageRating({ rating: 0, count: 0, loading: false });
    }
  };

  useEffect(() => {
    const checkIfApplied = async () => {
      if (!user || user.role !== 'volunteer') return;

      try {
        const { data } = await api.get('/applications');
        const apps = data.data || data;
        const applied = Array.isArray(apps) && apps.some(app => {
          // application may include nested opportunity object or opportunityId
          return app.opportunity?.id === id || app.opportunityId === id;
        });
        setHasApplied(!!applied);
      } catch (err) {
        console.error('Error fetching user applications', err);
      }
    };

    checkIfApplied();

    const fetchProfile = async () => {
      if (!user || user.role !== 'volunteer') return;
      try {
        const res = await volunteerService.getMyProfile();
        setApprovalStatus(res.data.approvalStatus || null);
      } catch (err) {
        console.error('Failed to fetch volunteer profile', err);
      }
    };

    fetchProfile();
  }, [user, id]);

  const handleApply = async () => {
    if (!user) {
      toast.error('Please login to apply');
      navigate('/login');
      return;
    }

    if (user.role !== 'volunteer') {
      toast.error('Only volunteers can apply for opportunities');
      return;
    }

    if (approvalStatus === 'pending') {
      toast.info('Your account approval is pending with a moderator — you cannot apply yet.');
      return;
    }

    setApplying(true);
    try {
      await api.post('/applications', { opportunityId: id });
      toast.success('Application submitted successfully!');
      // Refresh opportunity to update application status
      const { data } = await api.get(`/opportunities/${id}`);
      setOpportunity(data.data);
      setHasApplied(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleFindMatches = async () => {
    if (user?.role !== 'charity') {
      toast.error('Only charity organizations can view matched volunteers');
      return;
    }

    setMatchLoading(true);
    setMatchDialogOpen(true);
    setMatchedVolunteers(null);
    
    try {
      const { data } = await api.get(`/opportunities/${id}/matched-volunteers`, {
        params: { limit: 20, minScore: 30 }
      });
      setMatchedVolunteers(data.data || data);
    } catch (error) {
      toast.error('Failed to fetch matched volunteers');
      console.error('Matching error:', error);
      setMatchedVolunteers(null);
    } finally {
      setMatchLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default', published: 'success', in_progress: 'info',
      completed: 'secondary', cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const getRoleBasedActions = () => {
    if (!user) {
      return (
        <Button variant="contained" size="large" onClick={() => navigate('/login')}>
          Login to Apply
        </Button>
      );
    }

    if (user.role === 'volunteer') {
      const isFull = opportunity && (opportunity.volunteersConfirmed >= opportunity.numberOfVolunteers) && opportunity.numberOfVolunteers > 0;
      const disabled = applying || hasApplied || isFull || approvalStatus === 'pending';
      let label = 'Apply Now';
      if (applying) label = 'Applying...';
      else if (hasApplied) label = 'Already Applied';
      else if (approvalStatus === 'pending') label = 'Pending Approval';
      else if (isFull) label = 'Full';

      const tooltip = approvalStatus === 'pending'
        ? 'Your account approval is pending — you cannot apply yet.'
        : isFull
        ? 'This opportunity has reached the required number of volunteers.'
        : '';

      return (
        <Tooltip title={tooltip}>
          <span>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleApply}
              disabled={disabled}
              startIcon={applying ? <CircularProgress size={20} /> : null}
            >
              {label}
            </Button>
          </span>
        </Tooltip>
      );
    }

    if (user.role === 'charity') {
      return (
        <Button 
          variant="outlined" 
          size="large" 
          onClick={handleFindMatches}
          startIcon={<TrendingUp />}
        >
          Find Matched Volunteers
        </Button>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!opportunity) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Opportunity not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {opportunity.title}
        </Typography>
        <Chip 
          label={opportunity.status} 
          color={getStatusColor(opportunity.status)} 
          size="medium" 
        />
      </Box>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              About This Opportunity
            </Typography>
            <Typography variant="body1" paragraph>
              {opportunity.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Required Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {opportunity.requiredSkills?.map((skill) => (
                <Chip key={skill} label={skill} variant="outlined" />
              )) || <Typography color="text.secondary">No specific skills required</Typography>}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Additional Requirements
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Background Check Required" 
                  secondary={opportunity.backgroundCheckRequired ? 'Yes' : 'No'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Training Required" 
                  secondary={opportunity.trainingRequired ? 'Yes' : 'No'}
                />
              </ListItem>
              {opportunity.trainingRequired && opportunity.trainingDetails && (
                <ListItem>
                  <ListItemText 
                    primary="Training Details" 
                    secondary={opportunity.trainingDetails}
                  />
                </ListItem>
              )}
              {opportunity.physicalRequirements && (
                <ListItem>
                  <ListItemText 
                    primary="Physical Requirements" 
                    secondary={opportunity.physicalRequirements}
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          {/* Organization Info */}
          {opportunity.charity && (
            <Paper elevation={3} sx={{ p: 4 }}>
              {opportunity.charity.bannerImage && (
                <Box
                  sx={{
                    height: 150,
                    mb: 3,
                    borderRadius: 1,
                    backgroundImage: `url(${BASE_URL}${opportunity.charity.bannerImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}
              <Typography variant="h6" gutterBottom>
                <Business sx={{ mr: 1 }} />
                About the Organization
              </Typography>
              <Typography variant="h6">{opportunity.charity.organizationName}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {opportunity.charity.description}
              </Typography>
              <Typography variant="body2">
                <strong>Registration Number:</strong> {opportunity.charity.registrationNumber}
              </Typography>
              <Typography variant="body2">
                <strong>Website:</strong> {opportunity.charity.websiteUrl}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Info Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Information
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Category sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">
                  <strong>Category:</strong> {opportunity.category}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2">
                    <strong>Location:</strong> {opportunity.locationType}
                  </Typography>
                  {opportunity.city && (
                    <Typography variant="caption" color="text.secondary">
                      {opportunity.city}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2">
                    <strong>Duration:</strong> {opportunity.duration} hours
                  </Typography>
                  {opportunity.startDate && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Starts: {format(new Date(opportunity.startDate), 'PPP')}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Group sx={{ mr: 1, color: 'text.secondary' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">
                    <strong>Volunteers Needed:</strong> {opportunity.numberOfVolunteers}
                  </Typography>

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {opportunity.volunteersConfirmed || 0}/{opportunity.numberOfVolunteers} volunteers
                    </Typography>
                    <Box sx={{ height: 6, bgcolor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', bgcolor: 'primary.main', width: `${opportunity.numberOfVolunteers ? Math.min(100, (opportunity.volunteersConfirmed / opportunity.numberOfVolunteers) * 100) : 0}%` }} />
                    </Box>
                  </Box>
                </Box>
                {opportunity.volunteersConfirmed >= opportunity.numberOfVolunteers && opportunity.numberOfVolunteers > 0 && (
                  <Chip label="Full" size="small" color="default" variant="outlined" sx={{ ml: 1 }} />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Visibility sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">
                  <strong>Views:</strong> {typeof opportunity.views === 'number' ? opportunity.views : 0}
                </Typography>
              </Box>

              {opportunity.applicationDeadline && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Apply by:</strong> {format(new Date(opportunity.applicationDeadline), 'PPP')}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              
              {opportunity.contactPerson && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{opportunity.contactPerson}</Typography>
                </Box>
              )}

              {opportunity.contactEmail && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{opportunity.contactEmail}</Typography>
                </Box>
              )}

              {opportunity.contactPhone && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{opportunity.contactPhone}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Volunteer Rating Card */}
          {averageRating.count > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Charity Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {averageRating.loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <>
                      <Rating 
                        value={averageRating.rating} 
                        precision={0.1}
                        readOnly 
                        size="medium"
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {averageRating.rating.toFixed(1)}/5
                      </Typography>
                    </>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Based on {averageRating.count} volunteer rating{averageRating.count !== 1 ? 's' : ''} for this charity
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Box sx={{ textAlign: 'center' }}>
            {getRoleBasedActions()}
          </Box>
        </Grid>
      </Grid>

      {/* Matched Volunteers Dialog */}
      <Dialog 
        open={matchDialogOpen} 
        onClose={() => setMatchDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Matched Volunteers for "{opportunity.title}"
        </DialogTitle>
        <DialogContent>
          {matchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : matchedVolunteers ? (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Found {matchedVolunteers.totalFound} qualified volunteers out of {matchedVolunteers.totalEvaluated} evaluated
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Volunteer</TableCell>
                      <TableCell>Match Score</TableCell>
                      <TableCell>Matched Skills</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matchedVolunteers.matches?.map((match) => (
                      <TableRow key={match.volunteer.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ mr: 2 }}
                              src={match.volunteer.user?.profileImage ? `${BASE_URL}${match.volunteer.user.profileImage}` : null}
                            >
                              {match.volunteer.user?.firstName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {match.volunteer.user?.firstName} {match.volunteer.user?.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {match.volunteer.user?.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Rating value={match.matchScore / 20} readOnly precision={0.1} size="small" />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {match.matchScore}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {match.matchFactors?.skills?.matched?.map((skill) => (
                              <Chip key={skill} label={skill} size="small" color="primary" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {match.volunteer.city || 'Not specified'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Alert severity="info">
              No matching volunteers found or an error occurred while fetching matches.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMatchDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OpportunityDetail;
