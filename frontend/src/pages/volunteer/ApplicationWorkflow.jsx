import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';

// Replaced Timeline (MUI Lab) with a simple Stack-based status list
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Close as RejectIcon,
  Info as InfoIcon,
  History as TimelineIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { applicationService } from '../../services/applicationService';

const ApplicationWorkflow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await applicationService.getApplicationById(id);
      setApplication(response.data);
    } catch (err) {
      console.error('Error fetching application details:', err);
      setError(err.response?.data?.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const normalizeAdditionalInfoFields = (requested) => {
    if (!requested) return [];
    if (Array.isArray(requested.fields)) return requested.fields;
    if (typeof requested.fields === 'string' && requested.fields.trim()) return [requested.fields.trim()];
    if (Array.isArray(requested.message?.specificRequests)) return requested.message.specificRequests;
    return [];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'under_review': return 'info';
      case 'additional_info_requested': return 'warning';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      case 'withdrawn': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      under_review: 'Under Review',
      approved: 'Approved',
      confirmed: 'Confirmed',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
      additional_info_requested: 'Info Requested',
      background_check_required: 'Background Check',
      completed: 'Completed'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !application) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        }>
          {error || 'Application not found'}
        </Alert>
      </Container>
    );
  }

  const app = application.data || application;
  const volunteer = app.volunteer;
  const opportunity = app.opportunity;
  const charity = opportunity?.charity;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 1 }}
        >
          Back
        </Button>
        <Box flex={1}>
          <Typography variant="h4" gutterBottom>
            Application Workflow
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Communication history and status updates
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Application Overview */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon /> Application Overview
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Opportunity</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {opportunity?.title || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Charity</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {charity?.organizationName || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Volunteer</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {volunteer?.user?.firstName} {volunteer?.user?.lastName}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Current Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={getStatusLabel(app.status)}
                    color={getStatusColor(app.status)}
                    size="small"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">Applied On</Typography>
                <Typography variant="body2">
                  {format(new Date(app.createdAt), 'PPpp')}
                </Typography>
              </Box>

              {app.reviewedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body2">
                    {format(new Date(app.updatedAt), 'PPpp')}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Volunteer Info Card */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Volunteer Details</Typography>
            <Divider sx={{ my: 2 }} />
            
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body2">{volunteer?.user?.email}</Typography>
              </Box>

              {volunteer?.skills?.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Skills ({volunteer.skills.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {volunteer.skills.slice(0, 5).map((skill, idx) => (
                      <Chip key={idx} label={skill} size="small" variant="outlined" />
                    ))}
                    {volunteer.skills.length > 5 && (
                      <Chip label={`+${volunteer.skills.length - 5}`} size="small" />
                    )}
                  </Box>
                </Box>
              )}

              {volunteer?.interests?.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Interests
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {volunteer.interests.slice(0, 3).map((interest, idx) => (
                      <Chip key={idx} label={interest} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column: Communication Timeline */}
        <Grid item xs={12} md={8}>
          {/* Application Message */}
          {app.applicationMessage && (
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#e3f2fd', border: '1px solid #90caf9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MessageIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2">Volunteer's Message</Typography>
              </Box>
              <Typography variant="body2">
                {app.applicationMessage}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {format(new Date(app.createdAt), 'PPpp')}
              </Typography>
            </Paper>
          )}

          {/* Additional Info Request & Response */}
          {app.additionalInfoRequested && (
            <>
              <Paper sx={{ p: 3, mb: 3, backgroundColor: '#fff3e0', border: '1px solid #ffe0b2' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <InfoIcon fontSize="small" color="warning" />
                  <Typography variant="subtitle2">Charity Requested Additional Information</Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {app.additionalInfoRequested.message?.urgency && (
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        label={`Urgency: ${app.additionalInfoRequested.message.urgency}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  )}
                </Typography>

                {app.additionalInfoRequested.message?.specificRequests && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Requested Fields:
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {app.additionalInfoRequested.message.specificRequests.map((field, idx) => (
                        <Chip key={idx} label={field} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Message:</strong> {app.additionalInfoRequested.message?.customMessage || 'Additional information has been requested.'}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Requested on: {format(new Date(app.additionalInfoRequestedAt), 'PPpp')}
                </Typography>
              </Paper>

              {/* Provided Info Response */}
              {app.additionalInfoProvided && Object.keys(app.additionalInfoProvided).length > 0 && (
                <Paper sx={{ p: 3, mb: 3, backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircleIcon fontSize="small" color="success" />
                    <Typography variant="subtitle2">Volunteer Provided Information</Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    {Object.entries(app.additionalInfoProvided).map(([key, value], idx) => (
                      <Box key={idx} sx={{ mb: 1.5, pb: 1.5, borderBottom: idx < Object.keys(app.additionalInfoProvided).length - 1 ? '1px solid #c8e6c9' : 'none' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {key}:
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Provided on: {format(new Date(app.additionalInfoProvidedAt), 'PPpp')}
                  </Typography>
                </Paper>
              )}
            </>
          )}

          {/* Charity Review Notes */}
          {app.reviewNotes && (
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f3e5f5', border: '1px solid #e1bee7' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Charity Review Notes
              </Typography>
              <Typography variant="body2">
                {app.reviewNotes}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {format(new Date(app.reviewedAt), 'PPpp')}
              </Typography>
            </Paper>
          )}

          {/* Status Timeline */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon /> Status Timeline
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={2}>
              <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2">Application Submitted</Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(app.createdAt), 'MMM dd, yyyy hh:mm a')} — Applied for {opportunity?.title}
                </Typography>
              </Box>

              {app.additionalInfoRequestedAt && (
                <Box sx={{ p: 2, borderRadius: 1, bgcolor: '#fff8e1' }}>
                  <Typography variant="subtitle2">Additional Information Requested</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(app.additionalInfoRequestedAt), 'MMM dd, yyyy hh:mm a')} — Charity requested more details
                  </Typography>
                </Box>
              )}

              {app.additionalInfoProvidedAt && (
                <Box sx={{ p: 2, borderRadius: 1, bgcolor: '#e8f5e9' }}>
                  <Typography variant="subtitle2">Information Provided</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(app.additionalInfoProvidedAt), 'MMM dd, yyyy hh:mm a')} — Volunteer submitted requested information
                  </Typography>
                </Box>
              )}

              {app.reviewedAt && (
                <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2">Application {getStatusLabel(app.status)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(app.reviewedAt), 'MMM dd, yyyy hh:mm a')} — {app.status === 'approved' ? 'Your application has been approved!' : app.status === 'rejected' ? 'Your application was not accepted.' : 'Application is under review'}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ApplicationWorkflow;
