import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Pagination,
  Card,
  CardContent,
  Grid,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  EventBusy as EventBusyIcon,
  Feedback as FeedbackIcon,
  Event as EventIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import attendanceService from "../../services/attendanceService";

const AttendanceHistory = () => {
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Feedback dialog states
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);

  const statusOptions = [
    { value: "", label: "All Status" },
    {
      value: "present",
      label: "Present",
      color: "success",
      icon: <CheckCircleIcon />,
    },
    { value: "absent", label: "Absent", color: "error", icon: <CancelIcon /> },
    { value: "late", label: "Late", color: "warning", icon: <ScheduleIcon /> },
    {
      value: "excused",
      label: "Excused",
      color: "info",
      icon: <EventBusyIcon />,
    },
  ];

  const fetchAttendanceHistory = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(statusFilter && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };

      const response = await attendanceService.getMyAttendanceHistory(params);
      setAttendanceHistory(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast.error("Failed to fetch attendance history");
      console.error("Error fetching attendance history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [statusFilter, startDate, endDate]);

  const handlePageChange = (event, newPage) => {
    fetchAttendanceHistory(newPage);
  };

  const getStatusChip = (status) => {
    const statusConfig = statusOptions.find(
      (option) => option.value === status
    );
    if (!statusConfig) return null;

    return (
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        color={statusConfig.color}
        size="small"
      />
    );
  };

  const handleProvideFeedback = (attendance) => {
    setSelectedAttendance(attendance);
    setFeedback(attendance.volunteerFeedback || "");
    setRating(attendance.volunteerRating || 0);
    setFeedbackDialogOpen(true);
  };

  const submitFeedback = async () => {
    if (!selectedAttendance) return;

    try {
      await attendanceService.submitVolunteerFeedback(selectedAttendance.id, {
        volunteerFeedback: feedback,
        volunteerRating: rating,
      });
      toast.success("Feedback submitted successfully!");
      setFeedbackDialogOpen(false);
      fetchAttendanceHistory(pagination.currentPage);
    } catch (error) {
      toast.error("Failed to submit feedback");
      console.error("Error submitting feedback:", error);
    }
  };

  if (loading && attendanceHistory.length === 0) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: 4, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Attendance History
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View your participation records and provide feedback on volunteering
        opportunities.
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Records
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {attendanceHistory.length === 0 ? (
        <Alert severity="info">
          No attendance records found. Start volunteering to see your
          participation history here!
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Opportunity</TableCell>
                  <TableCell>Charity</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell> Charity's Rating</TableCell>
                  <TableCell>My Rating</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceHistory.map((attendance) => (
                  <TableRow key={attendance.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {attendance.opportunity.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
                          {format(
                            parseISO(attendance.opportunity.startDate),
                            "MMM dd, yyyy"
                          )}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          <BusinessIcon fontSize="small" sx={{ mr: 0.5 }} />
                          {attendance.opportunity.charity.organizationName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(
                          parseISO(attendance.createdAt),
                          "MMM dd, yyyy 'at' h:mm a"
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(attendance.status)}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <AccessTimeIcon
                          fontSize="small"
                          sx={{ mr: 0.5, color: "text.secondary" }}
                        />
                        {attendance.hoursWorked || "N/A"}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        {attendance.charityRating ? (
                          <>
                            <Rating
                              value={attendance.charityRating}
                              size="small"
                              readOnly
                            />
                            <Typography variant="caption" color="success.main">
                              {attendance.charityRating}/5
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No rating yet
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        {attendance.volunteerRating ? (
                          <>
                            <Rating
                              value={attendance.volunteerRating}
                              size="small"
                              readOnly
                            />
                            <Typography variant="caption" color="primary">
                              {attendance.volunteerRating}/5
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Not rated
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<FeedbackIcon />}
                        onClick={() => handleProvideFeedback(attendance)}
                        variant="contained"
                      >
                        Feedback
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center">
              <Pagination
                count={pagination.totalPages}
                page={pagination.currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Provide Feedback
          {selectedAttendance && (
            <Typography variant="subtitle2" color="text.secondary">
              For: {selectedAttendance.opportunity.title}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {/* Show Charity Rating if available */}
          {selectedAttendance?.charityRating && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: "success.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "success.200",
              }}
            >
              <Typography
                variant="body2"
                gutterBottom
                sx={{ fontWeight: "medium", color: "success.main" }}
              >
                Rating Received from Charity
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Rating
                  value={selectedAttendance.charityRating}
                  readOnly
                  size="medium"
                />
                <Typography variant="body2" color="success.main">
                  {selectedAttendance.charityRating}/5 stars
                </Typography>
              </Box>
              {selectedAttendance.charityFeedback && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Feedback: "{selectedAttendance.charityFeedback}"
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Volunteer Rating Section */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              gutterBottom
              sx={{ fontWeight: "medium" }}
            >
              Rate Your Experience
            </Typography>
            <Rating
              value={rating}
              onChange={(_, newValue) => setRating(newValue)}
              size="large"
            />
            {rating > 0 && (
              <Typography variant="body2" sx={{ mt: 1, color: "primary.main" }}>
                {rating}/5 stars
              </Typography>
            )}
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Feedback (Optional)"
            placeholder="Share your experience with this volunteering opportunity and organization..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitFeedback} variant="contained">
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AttendanceHistory;
