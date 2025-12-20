import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  Close as CloseIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const VolunteerMatchingDialog = ({ 
  open, 
  onClose, 
  opportunity, 
  matchResults, 
  loading,
  onViewProfile
}) => {
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);

  const getMatchColor = (score) => {
    if (score >= 70) return 'success';
    if (score >= 50) return 'info';
    if (score >= 30) return 'warning';
    return 'error';
  };

  const getMatchIcon = (recommendation) => {
    switch (recommendation) {
      case 'Excellent Match':
        return '🌟';
      case 'Good Match':
        return '👍';
      case 'Fair Match':
        return '⚖️';
      default:
        return '❓';
    }
  };

  if (!opportunity) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              Matched Volunteers for "{opportunity.title}"
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Finding volunteers that match your opportunity requirements
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
            <CircularProgress size={60} />
            <Typography sx={{ mt: 2 }}>Finding the best volunteers for your opportunity...</Typography>
          </Box>
        ) : matchResults?.matches?.length > 0 ? (
          <>
            {/* Summary Stats */}
            <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="h6" color="primary">
                      {matchResults.totalFound}
                    </Typography>
                    <Typography variant="body2">Quality Matches</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="h6" color="info.main">
                      {matchResults.totalEvaluated}
                    </Typography>
                    <Typography variant="body2">Volunteers Evaluated</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="h6" color="success.main">
                      {opportunity.numberOfVolunteers}
                    </Typography>
                    <Typography variant="body2">Volunteers Needed</Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="h6" color="warning.main">
                      {matchResults.searchCriteria.minScore}%
                    </Typography>
                    <Typography variant="body2">Min Match Score</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Volunteer Matches */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Top Volunteer Matches ({matchResults.matches.length})
            </Typography>
            
            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
              {matchResults.matches.map((match, index) => (
                <Card key={match.volunteer.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              {match.user.firstName} {match.user.lastName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.25 }}>
                              <Tooltip title="Copy email">
                                <Chip
                                  size="small"
                                  color="primary"
                                  icon={<EmailIcon fontSize="small" />}
                                  label={match.user.email}
                                  onClick={() => {
                                    if (navigator?.clipboard) {
                                      navigator.clipboard.writeText(match.user.email)
                                        .then(() => toast.success('Email copied to clipboard'))
                                        .catch(() => toast.error('Failed to copy email'));
                                    } else {
                                      toast.error('Clipboard not available');
                                    }
                                  }}
                                  clickable
                                  sx={{ cursor: 'pointer' }}
                                />
                              </Tooltip>
                              {match.user.phoneNumber && (
                                <Tooltip title="Copy phone">
                                  <Chip
                                    size="small"
                                    color="default"
                                    icon={<PhoneIcon fontSize="small" />}
                                    label={match.user.phoneNumber}
                                    onClick={() => {
                                      if (navigator?.clipboard) {
                                        navigator.clipboard.writeText(match.user.phoneNumber)
                                          .then(() => toast.success('Phone number copied to clipboard'))
                                          .catch(() => toast.error('Failed to copy phone number'));
                                      } else {
                                        toast.error('Clipboard not available');
                                      }
                                    }}
                                    clickable
                                    sx={{ cursor: 'pointer' }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {match.volunteer.city}, {match.volunteer.state}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip 
                                label={`Rank #${match.rank}`} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              <Chip 
                                label={`${match.matchPercentage}% Match`} 
                                size="small" 
                                color={getMatchColor(match.matchScore)}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'right' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            <Typography variant="h6" color={`${getMatchColor(match.matchScore)}.main`}>
                              {match.matchPercentage}%
                            </Typography>
                            <Typography variant="body2">
                              {getMatchIcon(match.recommendation)} {match.recommendation}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={match.matchPercentage} 
                            color={getMatchColor(match.matchScore)}
                            sx={{ mt: 1, mb: 1.5 }}
                          />
                          <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => onViewProfile && onViewProfile(match.volunteer)}
                          >
                            View Full Profile
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Match Factors */}
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2">
                          View detailed match breakdown ({match.matchFactors.length} factors)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={1}>
                          {match.matchFactors.map((factor, idx) => (
                            <Grid item xs={12} sm={6} key={idx}>
                              <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {factor.factor}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {factor.details}
                                </Typography>
                                <Typography variant="body2" color="primary">
                                  Score: {Math.round(factor.score)}/10
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>

                        {/* Volunteer Skills */}
                        {match.volunteer.skills && match.volunteer.skills.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                              Skills:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {match.volunteer.skills.map((skill) => (
                                <Chip 
                                  key={skill} 
                                  label={skill} 
                                  size="small" 
                                  variant={opportunity.requiredSkills?.includes(skill) ? "default" : "outlined"}
                                  color={opportunity.requiredSkills?.includes(skill) ? "success" : "default"}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        ) : (
          <Alert severity="info">
            <Typography variant="h6">No matching volunteers found</Typography>
            <Typography variant="body2">
              Try adjusting your opportunity requirements or check back later as new volunteers register.
              Consider:
            </Typography>
            <ul>
              <li>Making the opportunity virtual or hybrid</li>
              <li>Reducing specific skill requirements</li>
              <li>Extending the application deadline</li>
              <li>Broadening the location area</li>
            </ul>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {/* {matchResults?.matches?.length > 0 && (
          <Button variant="contained" onClick={() => {
            // Here you could implement a "Contact All" or "Invite All" feature
            toast.info('Contact feature will be implemented soon');
          }}>
            Contact Top Matches
          </Button>
        )} */}
      </DialogActions>
    </Dialog>
  );
};

export default VolunteerMatchingDialog;