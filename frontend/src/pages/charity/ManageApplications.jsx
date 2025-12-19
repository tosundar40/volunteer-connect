import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  AvatarGroup,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
  IconButton,
  Menu
} from "@mui/material";
import {
  CheckCircle as ApprovedIcon,
  HourglassEmpty as PendingIcon,
  Close as RejectIcon,
  Info as InfoIcon,
  Check as AcceptIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Verified as VerifiedIcon,
  School as QualIcon,
  Visibility as ViewIcon,
  Assignment as RequestInfoIcon,
  Security as SecurityIcon,
  MoreVert as MoreIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon
} from "@mui/icons-material";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { applicationService } from "../../services/applicationService";
import DetailedVolunteerProfile from "../../components/DetailedVolunteerProfile";
import RequestAdditionalInfoDialog from "../../components/RequestAdditionalInfoDialog";
import api from "../../services/api";

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// Utility functions for application management
const getApplicationPriority = (application) => {
  let priority = 'normal';
  
  // High priority for incomplete profiles
  const volunteer = application.volunteer;
  if (!volunteer?.dateOfBirth || !volunteer?.user?.phoneNumber || 
      !volunteer?.emergency_contact || !volunteer?.references?.length) {
    priority = 'high';
  }
  
  // Medium priority for info requests
  if (application.infoRequested) {
    priority = 'medium';
  }
  
  return priority;
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    default: return 'default';
  }
};

const ManageApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [charityData, setCharityData] = useState(null);
  
  // New vetting workflow state
  const [profileDialog, setProfileDialog] = useState(false);
  const [requestInfoDialog, setRequestInfoDialog] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [vettingHistory, setVettingHistory] = useState([]);



  // Fetch applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getApplications();
      setApplications(response.data || []);
    } catch (error) {
      toast.error("Failed to load applications");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/charity/profile");
        setCharityData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch charity profile", err);
      }
    };
    fetchProfile();
  }, []);

  // Get filtered applications by status
  const getFilteredApplications = () => {
    if (tabValue === 0) {
      // Pending includes both pending and under_review
      return applications.filter((app) => ['pending', 'under_review'].includes(app.status));
    } else if (tabValue === 1) {
      // Applications where charity has requested additional info
      return applications.filter((app) => app.status === 'additional_info_requested');
    } else if (tabValue === 2) {
      return applications.filter((app) => app.status === 'approved');
    } else if (tabValue === 3) {
      return applications.filter((app) => app.status === 'rejected');
    }
    return applications;
  };

  // Handle detailed profile viewing
  const handleViewProfile = (application) => {
    setSelectedApplication(application);
    setSelectedVolunteer(application.volunteer);
    setProfileDialog(true);
    setActionMenu(null);
  };

  // Handle requesting additional information
  const handleRequestInfo = (volunteer, application) => {
    setSelectedVolunteer(volunteer);
    setSelectedApplication(application);
    setRequestInfoDialog(true);
    setProfileDialog(false);
  };

  // Submit additional info request
  const submitInfoRequest = async (requestData) => {
    try {
      // Build the infoRequested array from request data
      const infoRequested = [
        ...(requestData.specificRequests || []),
        ...(requestData.customRequests || [])
      ];

      // Build the message with request details
      const message = requestData.message || 'Additional information has been requested.';

      await applicationService.requestAdditionalInfo(
        requestData.applicationId,
        infoRequested,
        message
      );
      
      toast.success("Information request sent successfully");
      setRequestInfoDialog(false);
      fetchApplications(); // Refresh to show updated status
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to send information request"
      );
    }
  };

  // Handle vetting decisions from profile dialog
  const handleVettingDecision = async (applicationId, decision) => {
    try {
      const status = decision === 'approve' ? 'approved' : 'rejected';
      await applicationService.updateApplicationStatus(applicationId, {
        status,
        reviewNotes: `Vetted through detailed profile review - ${decision}d`
      });
      
      toast.success(`Application ${decision}d successfully`);
      setProfileDialog(false);
      fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.error || `Failed to ${decision} application`
      );
    }
  };

  // Handle review dialog
  const handleReviewOpen = (application, action) => {
    setSelectedApplication(application);
    setReviewAction(action);
    setReviewNotes(application.reviewNotes || "");
    setReviewDialog(true);
  };

  // Submit review
  const submitReview = async () => {
    try {
      // Block review actions while charity profile is under review
      if (charityData?.verificationStatus === "pending") {
        toast.error(
          "Your charity profile is under review. You cannot make changes until approval is complete."
        );
        return;
      }
      setReviewing(true);

      if (reviewAction === "approve") {
        await applicationService.updateApplicationStatus(
          selectedApplication.id,
          {
            status: "approved",
            reviewNotes,
          }
        );
        toast.success("Application approved successfully");
      } else if (reviewAction === "reject") {
        await applicationService.updateApplicationStatus(
          selectedApplication.id,
          {
            status: "rejected",
            reviewNotes,
          }
        );
        toast.success("Application rejected");
      }

      setReviewDialog(false);
      setReviewNotes("");
      setSelectedApplication(null);
      setReviewAction(null);
      fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to update application"
      );
    } finally {
      setReviewing(false);
    }
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const statusMap = {
      pending: { icon: <PendingIcon />, label: "Pending", color: "warning" },
      under_review: {
        icon: <PendingIcon />,
        label: "Under Review",
        color: "info",
      },
      additional_info_requested: {
        icon: <RequestInfoIcon />,
        label: "Info Requested",
        color: "warning",
      },
      approved: { icon: <ApprovedIcon />, label: "Approved", color: "success" },
      confirmed: {
        icon: <ApprovedIcon />,
        label: "Confirmed",
        color: "success",
      },
      rejected: { icon: <RejectIcon />, label: "Rejected", color: "error" },
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

  const filteredApplications = getFilteredApplications();

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: 4, mb: 4, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage Volunteer Applications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and manage applications from volunteers for your opportunities
        </Typography>
      </Box>

      {charityData?.verificationStatus === "pending" && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your charity profile is under review. You cannot make changes until
          approval is complete.
        </Alert>
      )}

      {applications.length === 0 ? (
        <Alert severity="info" icon={<InfoIcon />}>
          No volunteer applications yet. Create opportunities to start receiving
          applications.
        </Alert>
      ) : (
        <>
          {/* Tabs for filtering by status */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(e, value) => setTabValue(value)}
              aria-label="application status tabs"
            >
              <Tab
                label={`Pending (${(
                  applications.filter((a) => ['pending', 'under_review'].includes(a.status)).length
                )})`}
              />
              <Tab
                label={`Info Requested (${(
                  applications.filter((a) => a.status === 'additional_info_requested').length
                )})`}
              />
              <Tab
                label={`Approved (${(
                  applications.filter((a) => a.status === "approved").length
                )})`}
              />
              <Tab
                label={`Rejected (${(
                  applications.filter((a) => a.status === "rejected").length
                )})`}
              />
            </Tabs>
          </Paper>

          {/* Applications List */}
          <TabPanel value={tabValue} index={0}>
            {filteredApplications.length === 0 ? (
              <Alert severity="info">No pending applications</Alert>
            ) : (
              <Grid container spacing={3}>
                {filteredApplications.map((application) => (
                  <Grid item xs={12} key={application.id}>
                    <ApplicationCard
                      application={application}
                      onReview={handleReviewOpen}
                      onViewProfile={handleViewProfile}
                      onRequestInfo={handleRequestInfo}
                      showActions={true}
                      disableActions={
                        charityData?.verificationStatus !== "approved"
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {filteredApplications.length === 0 ? (
              <Alert severity="info">No applications awaiting additional info</Alert>
            ) : (
              <Grid container spacing={3}>
                {filteredApplications.map((application) => (
                  <Grid item xs={12} key={application.id}>
                    <ApplicationCard
                      application={application}
                      onReview={handleReviewOpen}
                      onViewProfile={handleViewProfile}
                      onRequestInfo={handleRequestInfo}
                      showActions={true}
                      showInfoSummary={true}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {filteredApplications.length === 0 ? (
              <Alert severity="info">No approved applications</Alert>
            ) : (
              <Grid container spacing={3}>
                {filteredApplications.map((application) => (
                  <Grid item xs={12} key={application.id}>
                    <ApplicationCard
                      application={application}
                      onReview={handleReviewOpen}
                      onViewProfile={handleViewProfile}
                      onRequestInfo={handleRequestInfo}
                      showActions={false}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {filteredApplications.length === 0 ? (
              <Alert severity="info">No rejected applications</Alert>
            ) : (
              <Grid container spacing={3}>
                {filteredApplications.map((application) => (
                  <Grid item xs={12} key={application.id}>
                    <ApplicationCard
                      application={application}
                      onReview={handleReviewOpen}
                      onViewProfile={handleViewProfile}
                      onRequestInfo={handleRequestInfo}
                      showActions={false}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog}
        onClose={() => setReviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {reviewAction === "approve"
            ? "Approve Application"
            : "Reject Application"}
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Volunteer
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedApplication.volunteer?.user?.firstName}{" "}
                  {selectedApplication.volunteer?.user?.lastName}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Opportunity
                </Typography>
                <Typography variant="body2">
                  {selectedApplication.opportunity?.title}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Volunteer Message
                </Typography>
                <Typography variant="body2">
                  {selectedApplication.applicationMessage}
                </Typography>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Review Notes"
                placeholder="Add notes about your decision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
          <Button
            onClick={submitReview}
            variant="contained"
            color={reviewAction === "approve" ? "success" : "error"}
            disabled={reviewing}
          >
            {reviewing
              ? "Processing..."
              : reviewAction === "approve"
              ? "Approve"
              : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detailed Volunteer Profile Dialog */}
      <DetailedVolunteerProfile
        open={profileDialog}
        onClose={() => setProfileDialog(false)}
        volunteer={selectedVolunteer}
        application={selectedApplication}
        onRequestInfo={handleRequestInfo}
        onVettingDecision={handleVettingDecision}
      />

      {/* Request Additional Info Dialog */}
      <RequestAdditionalInfoDialog
        open={requestInfoDialog}
        onClose={() => setRequestInfoDialog(false)}
        volunteer={selectedVolunteer}
        application={selectedApplication}
        onSubmit={submitInfoRequest}
      />
    </Container>
  );
};

// Application Card Component
const ApplicationCard = ({
  application,
  onReview,
  onViewProfile,
  onRequestInfo,
  showActions,
  disableActions,
  showInfoSummary,
}) => {
  const volunteer = application.volunteer;
  const opportunity = application.opportunity;
  const [menuAnchor, setMenuAnchor] = useState(null);

  const priority = getApplicationPriority(application);
  const priorityColor = getPriorityColor(priority);

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const getProfileCompleteness = (volunteer) => {
    if (!volunteer) return 0;
    const fields = [
      volunteer.dateOfBirth,
      volunteer.user?.phoneNumber,
      volunteer.city,
      volunteer.skills?.length > 0,
      volunteer.interests?.length > 0,
      volunteer.availability,
      volunteer.emergencyContactName,
       volunteer.emergencyContactPhone,
       volunteer.isAvailableForEmergency,
    ];
    
    const completed = fields.filter(field => field).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completeness = getProfileCompleteness(volunteer);

  // Normalize additional info requested shape (support both { fields: [] , message: string }
  // and older { message: { specificRequests: [], customRequests: [], message: '' } })
  const _rawRequestedFields = application.additionalInfoRequested
    ? (application.additionalInfoRequested.fields
        || application.additionalInfoRequested.message?.specificRequests
        || application.additionalInfoRequested.message?.customRequests
        || [])
    : [];

  const requestedFields = Array.isArray(_rawRequestedFields)
    ? _rawRequestedFields
    : (_rawRequestedFields ? [_rawRequestedFields] : []);

  const requestedMessage = application.additionalInfoRequested
    ? (typeof application.additionalInfoRequested.message === 'string'
        ? application.additionalInfoRequested.message
        : application.additionalInfoRequested.message?.message || '')
    : '';

  return (
    <Card sx={{ position: 'relative' }}>
      {priority !== 'normal' && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1
          }}
        >
          {/* <Badge
            color={priorityColor}
            variant="dot"
            sx={{
              '& .MuiBadge-dot': {
                width: 12,
                height: 12
              }
            }}
          /> */}
        </Box>
      )}

      <CardContent>
        <Grid container spacing={2}>
          {/* Volunteer Info */}
          <Grid item xs={12} md={7}>
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Badge
                  badgeContent={`${completeness}%`}
                  color={completeness >= 80 ? 'success' : completeness >= 60 ? 'warning' : 'error'}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                >
                  <Avatar sx={{ width: 56, height: 56 }}>
                    {volunteer?.user?.firstName?.[0]}
                  </Avatar>
                </Badge>
                <Box flex={1}>
                  <Typography variant="h6">
                    {volunteer?.user?.firstName} {volunteer?.user?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {opportunity?.title}
                  </Typography>
                  
                  {/* Profile Status Indicators */}
                  {/* <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {!volunteer?.references?.length && (
                      <Tooltip title="No references provided">
                        <Chip 
                          icon={<WarningIcon />} 
                          label="No Refs" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                    {!volunteer?.emergency_contact && (
                      <Tooltip title="No emergency contact">
                        <Chip 
                          icon={<WarningIcon />} 
                          label="No Emergency Contact" 
                          size="small" 
                          color="warning" 
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                    {application.isSystemMatched && (
                      <Chip 
                        label="AI Matched" 
                        size="small" 
                        color="info" 
                        icon={<VerifiedIcon />}
                      />
                    )}
                  </Stack> */}
                </Box>
              </Box>
            </Box>

            <Stack spacing={1} sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {volunteer?.user?.email}
                </Typography>
              </Box>

              {volunteer?.skills && volunteer.skills.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Skills: {volunteer.skills.slice(0, 3).join(", ")}
                    {volunteer.skills.length > 3 && "..."} 
                    <Chip 
                      label={volunteer.skills.length} 
                      size="small" 
                      sx={{ ml: 1, height: 16 }}
                    />
                  </Typography>
                </Box>
              )}

              {volunteer?.interests && volunteer.interests.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Interests: {volunteer.interests.slice(0, 3).join(", ")}
                    {volunteer.interests.length > 3 && "..."}
                  </Typography>
                </Box>
              )}

              {volunteer?.experience && volunteer.experience.length > 0 && (
                <Box>
                  <Typography variant="caption" color="success.main">
                    ✓ Has volunteer experience ({volunteer.experience.length} entries)
                  </Typography>
                </Box>
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Application Message
              </Typography>
              <Typography variant="body2">
                {application.applicationMessage}
              </Typography>
            </Box>

            {application.reviewNotes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Review Notes
                  </Typography>
                  <Typography variant="body2">
                    {application.reviewNotes}
                  </Typography>
                </Box>
              </>
            )}

            {application.additionalInfoRequested && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Additional Information Requested
                  </Typography>
                  <Alert severity="info" size="small" sx={{ mb: 2 }}>
                    Additional information requested from volunteer
                  </Alert>
                  
                  {/* Short summary only when rendering in Info Requested tab */}
                  {showInfoSummary && application.additionalInfoRequested && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Summary:
                        {requestedFields && requestedFields.length > 0
                          ? ` ${requestedFields.slice(0, 3).join(', ')}${requestedFields.length > 3 ? '...' : ''}`
                          : ''}
                      </Typography>
                      {requestedMessage && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {requestedMessage.length > 120
                            ? `${requestedMessage.substring(0, 120)}...`
                            : requestedMessage}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Display requested fields */}
                  {requestedFields && requestedFields.length > 0 && (
                    <Box sx={{ mb: 2, pl: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Requested Fields:
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {requestedFields.map((field, idx) => (
                          <Chip
                            key={idx}
                            label={field}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Display provided information if available */}
                  {application.additionalInfoProvided && Object.keys(application.additionalInfoProvided).length > 0 && (
                    <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#e8f5e9', borderRadius: 1, border: '1px solid #c8e6c9' }}>
                      <Typography variant="caption" color="success.dark" sx={{ fontWeight: 600 }}>
                        ✓ Additional Information Provided
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(application.additionalInfoProvided).map(([key, value], idx) => (
                          <Box key={idx} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              {key}:
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.25, wordBreak: 'break-word' }}>
                              {typeof value === 'string' ? value : JSON.stringify(value)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Provided on: {format(new Date(application.additionalInfoProvidedAt), 'MMM dd, yyyy hh:mm a')}
                      </Typography>
                    </Box>
                  )}

                  {/* Show if requested but not yet provided */}
                  {!application.additionalInfoProvided || Object.keys(application.additionalInfoProvided).length === 0 && (
                    <Alert severity="warning" size="small" sx={{ mt: 1 }}>
                      Awaiting volunteer response
                    </Alert>
                  )}
                </Box>
              </>
            )}

            {application.infoRequested && !application.additionalInfoRequested && (
              <>
                <Divider sx={{ my: 2 }} />
                <Alert severity="info" size="small">
                  Additional information requested from volunteer
                </Alert>
              </>
            )}
          </Grid>

          {/* Right Info */}
          <Grid item xs={12} md={5}>
            <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1 }}
              >
                Status
              </Typography>
              <Chip
                icon={
                  application.status === "pending" ? (
                    <PendingIcon />
                  ) : application.status === "under_review" ? (
                    <TimelineIcon />
                  ) : application.status === "approved" ? (
                    <ApprovedIcon />
                  ) : application.status === "additional_info_requested" ? (
                    <RequestInfoIcon />
                  ) : (
                    <RejectIcon />
                  )
                }
                label={
                  application.status === "under_review"
                    ? "Under Review"
                    : application.status === "additional_info_requested"
                    ? "Additional Info Requested"
                    : application.status.charAt(0).toUpperCase() + application.status.slice(1)
                }
                color={
                  application.status === "pending"
                    ? "warning"
                    : application.status === "under_review"
                    ? "info"
                    : application.status === "approved"
                    ? "success"
                    : application.status === "additional_info_requested"
                    ? "warning"
                    : "error"
                }
                size="small"
              />

              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  Applied
                </Typography>
                <Typography variant="body2">
                  {format(new Date(application.createdAt), "MMM dd, yyyy")}
                </Typography>
              </Box>

              {volunteer?.rating && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    Rating
                  </Typography>
                  <Rating value={volunteer.rating} readOnly size="small" />
                </Box>
              )}

              {/* Quick Actions */}
              {/* <Box sx={{ mt: 3 }}>
                <IconButton
                  onClick={handleMenuOpen}
                  size="small"
                  sx={{ bgcolor: 'action.hover' }}
                >
                  <MoreIcon />
                </IconButton>
                
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => { onViewProfile(application); handleMenuClose(); }}>
                    <ViewIcon sx={{ mr: 1 }} /> View Full Profile
                  </MenuItem>
                  <MenuItem onClick={() => { onRequestInfo(volunteer, application); handleMenuClose(); }}>
                    <RequestInfoIcon sx={{ mr: 1 }} /> Request Info
                  </MenuItem>
                  {application.status === 'pending' && (
                    <>
                      <Divider />
                      <MenuItem onClick={() => { onReview(application, "approve"); handleMenuClose(); }}>
                        <AcceptIcon sx={{ mr: 1 }} color="success" /> Quick Approve
                      </MenuItem>
                      <MenuItem onClick={() => { onReview(application, "reject"); handleMenuClose(); }}>
                        <RejectIcon sx={{ mr: 1 }} color="error" /> Quick Reject
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </Box> */}
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      {showActions && (
        <>
          <Divider />
          <CardActions sx={{ justifyContent: "space-between", gap: 1 }}>
            <Box>
              <Button
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => onViewProfile(application)}
              >
                View Profile
              </Button>
              <Button
                size="small"
                startIcon={<RequestInfoIcon />}
                onClick={() => onRequestInfo(volunteer, application)}
                disabled={disableActions}
              >
                Request Info
              </Button>
            </Box>
            
            <Box>
              {application.status === 'additional_info_requested' ? (
                <Tooltip title={"You have requested additional information"}>
                  <span>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<AcceptIcon />}
                      disabled
                    >
                      Approve
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<AcceptIcon />}
                  onClick={() => onReview(application, "approve")}
                  disabled={disableActions}
                >
                  Approve
                </Button>
              )}

              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => onReview(application, "reject")}
                disabled={disableActions}
                sx={{ ml: 1 }}
              >
                Reject
              </Button>
            </Box>
          </CardActions>
        </>
      )}
    </Card>
  );
};

export default ManageApplications;
