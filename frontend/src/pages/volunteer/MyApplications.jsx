import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardContent, CardActions,
  Button, Box, Chip, Alert, CircularProgress, Divider,
  Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl,
  InputLabel, Select, MenuItem, FormControlLabel, Checkbox, RadioGroup, Radio
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon, HourglassEmpty as PendingIcon,
  Cancel as RejectedIcon, Delete as WithdrawIcon,
  Visibility as ViewIcon, Info as InfoIcon, Assignment as InfoRequestIcon,
  Warning as WarningIcon, Check as ConfirmIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { applicationService } from '../../services/applicationService';

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [additionalInfoDialog, setAdditionalInfoDialog] = useState(false);
  const [additionalInfoData, setAdditionalInfoData] = useState({});
  const [submittingInfo, setSubmittingInfo] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [committedHours, setCommittedHours] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Fetch applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getApplications();
      setApplications(response.data || []);
    } catch (error) {
      toast.error('Failed to load applications');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Handle view details - navigate to workflow page
  const handleViewDetails = (application) => {
    navigate(`/volunteer/application-workflow/${application.id}`);
  };

  // Normalize additional info fields (support array, string, or fallback to message.specificRequests)
  const normalizeAdditionalInfoFields = (requested) => {
    if (!requested) return [];
    if (Array.isArray(requested.fields)) return requested.fields;
    if (typeof requested.fields === 'string' && requested.fields.trim()) return [requested.fields.trim()];
    if (Array.isArray(requested.message?.specificRequests)) return requested.message.specificRequests;
    return [];
  };

  // Handle withdraw application
  const handleWithdraw = (application) => {
    setSelectedApplication(application);
    setWithdrawDialog(true);
  };

  // Handle provide additional information
  const handleProvideInfo = (application) => {
    setSelectedApplication(application);
    // Initialize form data based on requested fields (support array/string/fallback)
    const initialData = {};
    const fields = normalizeAdditionalInfoFields(application.additionalInfoRequested);
    fields.forEach((field, idx) => {
      const fieldKey = typeof field === 'string' ? field : (field?.name || field?.label || `field_${idx}`);
      initialData[fieldKey] = '';
    });
    setAdditionalInfoData(initialData);
    setAdditionalInfoDialog(true);
  };

  // Handle confirm participation
  const handleConfirmParticipation = (application) => {
    setSelectedApplication(application);
    setCommittedHours('');
    setConfirmDialog(true);
  };

  // Submit additional information
  const submitAdditionalInfo = async () => {
    try {
      setSubmittingInfo(true);
      await applicationService.provideAdditionalInfo(selectedApplication.id, additionalInfoData);
      toast.success('Additional information submitted successfully');
      setAdditionalInfoDialog(false);
      setAdditionalInfoData({});
      setSelectedApplication(null);
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit additional information');
    } finally {
      setSubmittingInfo(false);
    }
  };

  // Handle input change for additional info form
  const handleInfoInputChange = (field, value) => {
    setAdditionalInfoData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit withdrawal
  const submitWithdrawal = async () => {
    try {
      setWithdrawing(true);
      await applicationService.withdrawApplication(selectedApplication.id, withdrawReason);
      toast.success('Application withdrawn successfully');
      setWithdrawDialog(false);
      setWithdrawReason('');
      setSelectedApplication(null);
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to withdraw application');
    } finally {
      setWithdrawing(false);
    }
  };

  // Submit confirmation
  const submitConfirmation = async () => {
    try {
      setConfirming(true);
      await applicationService.confirmParticipation(selectedApplication.id, {
        committedHours: parseInt(committedHours)
      });
      toast.success('Participation confirmed successfully!');
      setConfirmDialog(false);
      setCommittedHours('');
      setSelectedApplication(null);
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to confirm participation');
    } finally {
      setConfirming(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusMap = {
      pending: { icon: <PendingIcon />, label: 'Pending', color: 'warning' },
      under_review: { icon: <PendingIcon />, label: 'Under Review', color: 'info' },
      approved: { icon: <ApprovedIcon />, label: 'Approved', color: 'success' },
      confirmed: { icon: <ConfirmIcon />, label: 'Confirmed', color: 'success' },
      rejected: { icon: <RejectedIcon />, label: 'Rejected', color: 'error' },
      withdrawn: { icon: <RejectedIcon />, label: 'Withdrawn', color: 'error' },
      additional_info_requested: { icon: <InfoRequestIcon />, label: 'Info Requested', color: 'warning' },
      background_check_required: { icon: <WarningIcon />, label: 'Background Check', color: 'info' },
      moderator_review: { icon: <WarningIcon />, label: 'Moderator Review', color: 'warning' }
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <Chip
        icon={statusInfo.icon}
        label={statusInfo.label}
        color={statusInfo.color}
        variant="outlined"
        size="small"
      />
    );
  };

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
          My Applications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track the status of your volunteer opportunity applications
        </Typography>
      </Box>

      {applications.length === 0 ? (
        <Alert severity="info" icon={<InfoIcon />}>
          You haven't applied for any opportunities yet.{' '}
          <Button component="a" href="/opportunities" color="info" size="small">
            Browse opportunities
          </Button>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {applications.map((application) => (
            <Grid item xs={12} key={application.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Grid container spacing={2}>
                    {/* Left side: Opportunity info */}
                    <Grid item xs={12} md={8}>
                      <Typography variant="h6" gutterBottom>
                        {application.opportunity?.title || 'Opportunity Title Not Available'}
                      </Typography>

                      <Stack spacing={1} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Charity:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {application.opportunity?.charity?.organizationName || 'Charity Name Not Available'}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Opportunity Date:
                          </Typography>
                          <Typography variant="body2">
                            {application.opportunity?.startDate 
                              ? format(new Date(application.opportunity.startDate), 'MMM dd, yyyy')
                              : 'Date not available'
                            }
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Applied On:
                          </Typography>
                          <Typography variant="body2">
                            {application.createdAt 
                              ? format(new Date(application.createdAt), 'MMM dd, yyyy hh:mm a')
                              : 'Date not available'
                            }
                          </Typography>
                        </Box>

                        {application.reviewNotes && (
                          <Box sx={{ mt: 1, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              Charity Notes:
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {application.reviewNotes || 'No notes provided'}
                            </Typography>
                          </Box>
                        )}

                        {application.status === 'additional_info_requested' && application.additionalInfoRequested && (typeof application.additionalInfoRequested === 'object') && (application.additionalInfoRequested?.message || application.additionalInfoRequested?.specificRequests) && (
                          <Alert severity="warning" sx={{ mt: 1 }} icon={<InfoRequestIcon />}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Additional Information Required
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {typeof application.additionalInfoRequested?.message === 'string' 
                                ? application.additionalInfoRequested.message 
                                : 'Please provide additional information as requested by the charity.'}
                            </Typography>
                          </Alert>
                        )}
                      </Stack>
                    </Grid>

                    {/* Right side: Status */}
                    <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                      <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Status
                        </Typography>
                        <StatusBadge status={application.status} />

                        {application.status === 'approved' && (
                          <Alert severity="success" sx={{ mt: 2 }}>
                            Your application has been approved! Please confirm your participation.
                          </Alert>
                        )}

                        {application.status === 'confirmed' && (
                          <Alert severity="success" sx={{ mt: 2 }}>
                            You have confirmed your participation in this opportunity!
                          </Alert>
                        )}

                        {application.status === 'rejected' && (
                          <Alert severity="error" sx={{ mt: 2 }}>
                            Your application was not accepted for this opportunity.
                          </Alert>
                        )}

                        {application.status === 'additional_info_requested' && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            Please provide the requested additional information.
                          </Alert>
                        )}

                        {application.status === 'background_check_required' && (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            A background check is required to proceed.
                          </Alert>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>

                <Divider />

                <CardActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewDetails(application)}
                  >
                    View Details
                  </Button>

                  {application.status === 'approved' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<ConfirmIcon />}
                      onClick={() => handleConfirmParticipation(application)}
                    >
                      Confirm Participation
                    </Button>
                  )}

                  {application.status === 'additional_info_requested' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      startIcon={<InfoRequestIcon />}
                      onClick={() => handleProvideInfo(application)}
                    >
                      Provide Info
                    </Button>
                  )}

                  {(application.status === 'pending' || application.status === 'under_review' || application.status === 'additional_info_requested') && (
                    <Button
                      size="small"
                      color="error"
                      startIcon={<WithdrawIcon />}
                      onClick={() => handleWithdraw(application)}
                    >
                      Withdraw
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog} onClose={() => setWithdrawDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Withdraw Application</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
            Are you sure you want to withdraw your application for{' '}
            <strong>{selectedApplication?.opportunity?.title || 'this opportunity'}</strong>?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for withdrawal (optional)"
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            placeholder="Tell the charity why you're withdrawing..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialog(false)}>Cancel</Button>
          <Button
            onClick={submitWithdrawal}
            variant="contained"
            color="error"
            disabled={withdrawing}
          >
            {withdrawing ? 'Withdrawing...' : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Additional Information Dialog */}
      <Dialog open={additionalInfoDialog} onClose={() => setAdditionalInfoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Provide Additional Information</DialogTitle>
        <DialogContent>
          {selectedApplication?.additionalInfoRequested && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Message from {selectedApplication.opportunity?.charity?.organizationName || 'the charity'}:
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {typeof selectedApplication.additionalInfoRequested?.message === 'string'
                    ? selectedApplication.additionalInfoRequested.message
                    : 'Please provide additional information as requested.'}
                </Typography>
              </Alert>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Please provide the following information:
              </Typography>

              <Stack spacing={3}>
                {(() => {
                  const normalized = normalizeAdditionalInfoFields(selectedApplication?.additionalInfoRequested);
                  if (normalized.length === 0) {
                    return (
                      <Alert severity="info">
                        No specific fields requested. Please provide any additional information you feel is relevant.
                      </Alert>
                    );
                  }

                  return normalized.map((field, index) => {
                    const fieldLabel = typeof field === 'string' ? field : (field?.name || field?.label || 'Additional Information');
                    const fieldName = typeof field === 'string' ? field : (field?.name || field?.label || `field_${index}`);

                    // Simple field rendering - can be enhanced based on field types
                    const renderField = () => {
                      if (fieldLabel.toLowerCase().includes('experience')) {
                        return (
                          <TextField
                            key={fieldName}
                            fullWidth
                            multiline
                            rows={4}
                            label={fieldLabel}
                            value={additionalInfoData[fieldName] || ''}
                            onChange={(e) => handleInfoInputChange(fieldName, e.target.value)}
                            placeholder="Please describe your relevant experience..."
                          />
                        );
                      } else if (fieldLabel.toLowerCase().includes('availability')) {
                        return (
                          <TextField
                            key={fieldName}
                            fullWidth
                            multiline
                            rows={3}
                            label={fieldLabel}
                            value={additionalInfoData[fieldName] || ''}
                            onChange={(e) => handleInfoInputChange(fieldName, e.target.value)}
                            placeholder="Please specify your availability..."
                          />
                        );
                      } else if (fieldLabel.toLowerCase().includes('reference')) {
                        return (
                          <TextField
                            key={fieldName}
                            fullWidth
                            multiline
                            rows={3}
                            label={fieldLabel}
                            value={additionalInfoData[fieldName] || ''}
                            onChange={(e) => handleInfoInputChange(fieldName, e.target.value)}
                            placeholder="Name, relationship, contact information..."
                          />
                        );
                      } else if (fieldLabel.toLowerCase().includes('motivation') || fieldLabel.toLowerCase().includes('why')) {
                        return (
                          <TextField
                            key={fieldName}
                            fullWidth
                            multiline
                            rows={4}
                            label={fieldLabel}
                            value={additionalInfoData[fieldName] || ''}
                            onChange={(e) => handleInfoInputChange(fieldName, e.target.value)}
                            placeholder="Please share your motivation..."
                          />
                        );
                      } else {
                        return (
                          <TextField
                            key={fieldName}
                            fullWidth
                            multiline
                            rows={2}
                            label={fieldLabel}
                            value={additionalInfoData[fieldName] || ''}
                            onChange={(e) => handleInfoInputChange(fieldName, e.target.value)}
                            placeholder={`Please provide information about: ${fieldLabel}`}
                          />
                        );
                      }
                    };

                    return renderField();
                  });
                })()}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdditionalInfoDialog(false)}>Cancel</Button>
          <Button
            onClick={submitAdditionalInfo}
            variant="contained"
            disabled={submittingInfo || !Object.values(additionalInfoData).some(value => value.trim())}
          >
            {submittingInfo ? 'Submitting...' : 'Submit Information'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Participation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Participation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, mt: 1 }}>
            Please confirm your participation for{' '}
            <strong>{selectedApplication?.opportunity?.title || 'this opportunity'}</strong> and specify 
            how many hours you can commit to this volunteer activity.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              By confirming, you are committing to participate in this volunteer opportunity. 
              The charity will count on your participation.
            </Typography>
          </Alert>

          <TextField
            fullWidth
            type="number"
            label="Committed Hours"
            value={committedHours}
            onChange={(e) => setCommittedHours(e.target.value)}
            placeholder="Enter number of hours you can commit"
            inputProps={{ min: 1, max: 168 }}
            helperText="Please enter the number of hours you can commit to this opportunity"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={submitConfirmation}
            variant="contained"
            color="success"
            disabled={confirming || !committedHours || parseInt(committedHours) < 1}
          >
            {confirming ? 'Confirming...' : 'Confirm Participation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyApplications;
