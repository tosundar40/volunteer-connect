import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Avatar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Badge,
  Rating,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as EducationIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  Verified as VerifiedIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Language as LanguageIcon,
  Interests as InterestsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/api';

const DetailedVolunteerProfile = ({ 
  open, 
  onClose, 
  volunteer, 
  application,
  onRequestInfo,
  onVettingDecision 
}) => {
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [riskAssessment, setRiskAssessment] = useState('low');
  const [averageRating, setAverageRating] = useState({
    rating: 0,
    count: 0,
    loading: true
  });

  useEffect(() => {
    if (volunteer) {
      calculateProfileCompleteness();
      fetchVolunteerAverageRating();
    }
  }, [volunteer]);

  const fetchVolunteerAverageRating = async () => {
    if (!volunteer?.id) return;
    
    setAverageRating(prev => ({ ...prev, loading: true }));
    try {
      const { data } = await api.get(`/attendance/volunteer/${volunteer.id}/average-rating`);
      setAverageRating({
        rating: data.data.averageRating || 0,
        count: data.data.ratingCount || 0,
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch volunteer rating:', error);
      setAverageRating({ rating: 0, count: 0, loading: false });
    }
  };

  const calculateProfileCompleteness = () => {
    if (!volunteer) return 0;
    // Map completeness checks to actual Volunteer model fields
    const fields = [
      volunteer.dateOfBirth,
      // phone number usually lives on user account
      volunteer.user?.phoneNumber,
      volunteer.city,
      (Array.isArray(volunteer.skills) && volunteer.skills.length > 0) || false,
      (Array.isArray(volunteer.interests) && volunteer.interests.length > 0) || false,
      // availability JSON: consider present if days or times specified
      (volunteer.availability && ((volunteer.availability.days && volunteer.availability.days.length > 0) || (volunteer.availability.times && volunteer.availability.times.length > 0))) || false,
      // emergency contact fields from model
      volunteer.emergencyContactName || volunteer.emergencyContactPhone || false,
      // qualifications array on model
      (Array.isArray(volunteer.qualifications) && volunteer.qualifications.length > 0) || false
    ];

    const completed = fields.filter(Boolean).length;
    const percentage = Math.round((completed / fields.length) * 100) || 0;
    setProfileCompleteness(percentage);
    // Immediately assess risk using the freshly computed percentage to avoid stale state
    assessRisk(percentage);
    return percentage;
  };

  const assessRisk = (completeness = profileCompleteness) => {
    if (!volunteer) return;

    let riskScore = 0;

    // Incomplete profile increases risk
    if (completeness < 70) riskScore += 2;

    // Lack of qualifications increases risk slightly
    if (!volunteer.qualifications || volunteer.qualifications.length === 0) riskScore += 0.5;

    // No emergency contact increases risk
    if (!volunteer.emergencyContactName && !volunteer.emergencyContactPhone) riskScore += 1;

    // (experience removed from risk assessment per request)

    if (riskScore >= 3) setRiskAssessment('high');
    else if (riskScore >= 1.5) setRiskAssessment('medium');
    else setRiskAssessment('low');
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getCompletenessColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  if (!volunteer) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar 
              sx={{ width: 56, height: 56 }}
              src={volunteer.user?.profileImage}
            >
              {volunteer.user?.firstName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {volunteer.user?.firstName} {volunteer.user?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Volunteer Profile Review
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Profile Overview Stats */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>Profile Completeness</Typography>
                <Box sx={{ mt: 0.5, mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={profileCompleteness}
                    color={getCompletenessColor(profileCompleteness)}
                    sx={{ height: 6, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="h5" color={`${getCompletenessColor(profileCompleteness)}.main`} sx={{ fontWeight: 600 }}>
                  {profileCompleteness}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>Risk Assessment</Typography>
                <Box sx={{ mt: 1, mb: 1 }}>
                  <SecurityIcon sx={{ fontSize: 28, color: `${getRiskColor(riskAssessment)}.main` }} />
                </Box>
                <Chip 
                  label={riskAssessment.toUpperCase()} 
                  color={getRiskColor(riskAssessment)}
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>Average Rating</Typography>
                <Box sx={{ mt: 1, mb: 0.5 }}>
                  {averageRating.loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Stack alignItems="center" spacing={0.25}>
                      <Rating 
                        value={averageRating.rating} 
                        precision={0.1}
                        readOnly 
                        size="small"
                      />
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                        {averageRating.rating.toFixed(1)}/5
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {averageRating.count} rating{averageRating.count !== 1 ? 's' : ''}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>Application Status</Typography>
                <Box sx={{ mt: 1, mb: 1 }}>
                  {application?.status === 'pending' && <TimeIcon sx={{ fontSize: 28, color: 'warning.main' }} />}
                  {application?.status === 'under_review' && <AssignmentIcon sx={{ fontSize: 28, color: 'info.main' }} />}
                  {application?.status === 'approved' && <CheckCircleIcon sx={{ fontSize: 28, color: 'success.main' }} />}
                </Box>
                <Chip 
                  label={application?.status?.replace('_', ' ').toUpperCase() || 'PENDING'} 
                  color={
                    application?.status === 'approved' ? 'success' :
                    application?.status === 'under_review' ? 'info' : 'warning'
                  }
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Detailed Information */}
        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Basic Information */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon /> Basic Information
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                    </Box>
                    <Typography variant="body1">{volunteer.user?.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                    </Box>
                    <Typography variant="body1">{volunteer.user?.phoneNumber || 'Not provided'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                    </Box>
                    <Typography variant="body1">
                      {volunteer.city ? `${volunteer.city}, ${volunteer.state || ''} ${volunteer.country || ''}` : 'Not provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                    </Box>
                    <Typography variant="body1">
                      {volunteer.dateOfBirth ? format(new Date(volunteer.dateOfBirth), 'MMM dd, yyyy') : 'Not provided'}
                    </Typography>
                  </Grid>
                  {volunteer.address && (
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="body2" color="text.secondary">Address</Typography>
                      </Box>
                      <Typography variant="body1">{volunteer.address}</Typography>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Skills & Interests */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InterestsIcon /> Skills & Interests
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom>Skills</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {volunteer.skills?.map((skill, index) => (
                        <Chip key={index} label={skill} variant="outlined" size="small" />
                      )) || <Typography color="text.secondary">No skills listed</Typography>}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" gutterBottom>Interests</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {volunteer.interests?.map((interest, index) => (
                        <Chip key={index} label={interest} variant="outlined" size="small" />
                      )) || <Typography color="text.secondary">No interests listed</Typography>}
                    </Stack>
                  </Grid>
                  {volunteer.languages && volunteer.languages.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LanguageIcon fontSize="small" /> Languages
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {volunteer.languages.map((lang, index) => (
                          <Chip key={index} label={lang} variant="outlined" size="small" />
                        ))}
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Qualifications */}
            {volunteer.qualifications && volunteer.qualifications.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EducationIcon /> Qualifications
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mt: 1 }}>
                    <Stack spacing={1}>
                      {volunteer.qualifications.map((qual, index) => (
                        <Typography key={index} variant="body2">{qual}</Typography>
                      ))}
                    </Stack>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Availability */}
            {volunteer.availability && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon /> Availability
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {volunteer.availability.days && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Available Days</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                          {volunteer.availability.days.map((day, index) => (
                            <Chip key={index} label={day} size="small" />
                          ))}
                        </Stack>
                      </Grid>
                    )}
                    {volunteer.availability.hours && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" gutterBottom>Preferred Hours</Typography>
                        <Typography variant="body2">{volunteer.availability.hours}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Emergency Contact */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedIcon /> Emergency Contact
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  { (volunteer.emergencyContactName || volunteer.emergencyContactPhone || volunteer.emergencyContactRelation) ? (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>Emergency Contact</Typography>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2">{volunteer.emergencyContactName || 'Not provided'}</Typography>
                          <Typography variant="body2" color="text.secondary">{volunteer.emergencyContactRelation || ''}</Typography>
                          <Typography variant="body2">{volunteer.emergencyContactPhone || ''}</Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  ) : (
                    <Alert severity="warning">No emergency contact provided</Alert>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Application Details */}
            {application && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon /> Application Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Opportunity</Typography>
                      <Typography variant="body1">{application.opportunity?.title}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Application Message</Typography>
                      <Typography variant="body2">{application.applicationMessage}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Applied On</Typography>
                      <Typography variant="body2">
                        {format(new Date(application.createdAt), 'MMM dd, yyyy - HH:mm')}
                      </Typography>
                    </Box>
                    {application.reviewNotes && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Review Notes</Typography>
                        <Typography variant="body2">{application.reviewNotes}</Typography>
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          variant="outlined" 
          onClick={() => onRequestInfo(volunteer, application)}
          disabled={!application}
        >
          Request Info
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        {application?.status === 'pending' && (
          <>
            <Button 
              variant="contained" 
              color="success"
              onClick={() => onVettingDecision(application.id, 'approve')}
            >
              Approve
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => onVettingDecision(application.id, 'reject')}
            >
              Reject
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DetailedVolunteerProfile;