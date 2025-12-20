import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Alert,
  Grid,
  Rating,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  EventBusy as EventBusyIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import attendanceService from "../services/attendanceService";

const AttendanceDialog = ({ open, onClose, opportunity }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    status: "",
    hoursWorked: "",
    checkInTime: null,
    checkOutTime: null,
    notes: "",
    charityFeedback: "",
    charityRating: 0,
    volunteerFeedback: "",
    volunteerRating: 0,
  });

  const statusOptions = [
    { value: "present", label: "Present", color: "success", icon: <CheckCircleIcon /> },
    { value: "absent", label: "Absent", color: "error", icon: <CancelIcon /> },
    { value: "late", label: "Late", color: "warning", icon: <ScheduleIcon /> },
    { value: "excused", label: "Excused", color: "info", icon: <EventBusyIcon /> },
  ];

  const fetchVolunteers = async () => {
    if (!opportunity?.id) return;
    
    setLoading(true);
    try {
      const response = await attendanceService.getVolunteersForAttendance(opportunity.id);
      setVolunteers(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch volunteers");
      console.error("Error fetching volunteers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && opportunity?.id) {
      fetchVolunteers();
    }
  }, [open, opportunity?.id]);

  const handleEditAttendance = (volunteer) => {
    const attendance = volunteer.attendance;

    // If attendance was already recorded by the charity, open in view-only mode
    const readOnly = !!(attendance && attendance.recordedBy);
    setIsReadOnly(readOnly);

    setEditingVolunteer(volunteer.id);
    setAttendanceData({
      status: attendance?.status || "",
      hoursWorked: attendance?.hoursWorked || "",
      checkInTime: attendance?.checkInTime ? new Date(attendance.checkInTime) : null,
      checkOutTime: attendance?.checkOutTime ? new Date(attendance.checkOutTime) : null,
      notes: attendance?.notes || "",
      charityFeedback: attendance?.charityFeedback || "",
      charityRating: attendance?.charityRating || 0,
      volunteerFeedback: attendance?.volunteerFeedback || "",
      volunteerRating: attendance?.volunteerRating || 0,
    });
  };

  const handleSaveAttendance = async () => {
    try {
      const volunteer = volunteers.find(v => v.id === editingVolunteer);
      if (!volunteer) return;

      const payload = {
        opportunityId: opportunity.id,
        volunteerId: volunteer.id,
        status: attendanceData.status,
        hoursWorked: attendanceData.hoursWorked ? parseFloat(attendanceData.hoursWorked) : null,
        checkInTime: attendanceData.checkInTime,
        checkOutTime: attendanceData.checkOutTime,
        notes: attendanceData.notes,
        charityFeedback: attendanceData.charityFeedback,
        charityRating: attendanceData.charityRating || null,
        volunteerFeedback: attendanceData.volunteerFeedback,
        volunteerRating: attendanceData.volunteerRating || null,
      };

      await attendanceService.recordAttendance(payload);
      toast.success("Attendance recorded successfully");
      
      // Refresh volunteers list
      await fetchVolunteers();
      
      // Reset form
      setEditingVolunteer(null);
      setAttendanceData({
        status: "",
        hoursWorked: "",
        checkInTime: null,
        checkOutTime: null,
        notes: "",
        charityFeedback: "",
        charityRating: 0,
        volunteerFeedback: "",
        volunteerRating: 0,
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to record attendance");
      console.error("Error saving attendance:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingVolunteer(null);
    setAttendanceData({
      status: "",
      hoursWorked: "",
      checkInTime: null,
      checkOutTime: null,
      notes: "",
      charityFeedback: "",
      charityRating: 0,
      volunteerFeedback: "",
      volunteerRating: 0,
    });
  };

  const getStatusChip = (status) => {
    const statusConfig = statusOptions.find(option => option.value === status);
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

  const handleClose = () => {
    handleCancelEdit();
    onClose();
  };

  if (!opportunity) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Attendance Tracking - {opportunity.title}
            </Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : volunteers.length === 0 ? (
            <Alert severity="info">
              No confirmed volunteers found for this opportunity.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Volunteer</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {volunteers.map((volunteer) => (
                    <TableRow key={volunteer.id}>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {volunteer.firstName} {volunteer.lastName}
                        </Typography>
                        {volunteer.skills && volunteer.skills.length > 0 && (
                          <Box mt={0.5}>
                            {volunteer.skills.slice(0, 3).map((skill, index) => (
                              <Chip
                                key={index}
                                label={skill}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{volunteer.email}</TableCell>
                      <TableCell>{volunteer.phoneNumber || "N/A"}</TableCell>
                      <TableCell>
                        {volunteer.attendance?.status ? 
                          getStatusChip(volunteer.attendance.status) : 
                          <Chip label="Not recorded" size="small" variant="outlined" />
                        }
                      </TableCell>
                      <TableCell>
                        {volunteer.attendance?.hoursWorked || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant={editingVolunteer === volunteer.id ? "contained" : "outlined"}
                          onClick={() => handleEditAttendance(volunteer)}
                          disabled={editingVolunteer && editingVolunteer !== volunteer.id}
                        >
                          {editingVolunteer === volunteer.id ? "Editing" : (volunteer.attendance && volunteer.attendance.recordedBy ? "View" : "Record")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {editingVolunteer && (
            <Paper sx={{ mt: 3, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Record Attendance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={attendanceData.status}
                      label="Status"
                      onChange={(e) => setAttendanceData(prev => ({ ...prev, status: e.target.value }))}
                      disabled={isReadOnly}
                    >
                      {statusOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {option.icon}
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hours Worked"
                    type="number"
                    value={attendanceData.hoursWorked}
                    onChange={(e) => setAttendanceData(prev => ({ ...prev, hoursWorked: e.target.value }))}
                    inputProps={{ step: "0.5", min: "0" }}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="Check-in Time"
                    value={attendanceData.checkInTime}
                    onChange={(value) => setAttendanceData(prev => ({ ...prev, checkInTime: value }))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        disabled: isReadOnly
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DateTimePicker
                    label="Check-out Time"
                    value={attendanceData.checkOutTime}
                    onChange={(value) => setAttendanceData(prev => ({ ...prev, checkOutTime: value }))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        disabled: isReadOnly
                      }
                    }}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={2}
                    value={attendanceData.notes}
                    onChange={(e) => setAttendanceData(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Feedback for Volunteer"
                    multiline
                    rows={2}
                    value={attendanceData.charityFeedback}
                    onChange={(e) => setAttendanceData(prev => ({ ...prev, charityFeedback: e.target.value }))}
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                      Rate Volunteer Performance (Optional)
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Rating
                        value={attendanceData.charityRating}
                        onChange={(_, newValue) => setAttendanceData(prev => ({ ...prev, charityRating: newValue }))}
                        size="large"
                        readOnly={isReadOnly}
                      />
                      {attendanceData.charityRating > 0 && (
                        <Typography variant="body2" color="primary">
                          {attendanceData.charityRating}/5 stars
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Your rating will help other charities evaluate this volunteer's contributions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Volunteer's Feedback about Organization/Opportunity"
                    multiline
                    rows={2}
                    value={attendanceData.volunteerFeedback}
                    onChange={(e) => setAttendanceData(prev => ({ ...prev, volunteerFeedback: e.target.value }))}
                    helperText="Record any feedback the volunteer provided about the experience"
                    disabled={isReadOnly}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium', color: 'info.main' }}>
                      Volunteer's Rating of Organization/Opportunity
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Rating
                        value={attendanceData.volunteerRating}
                        onChange={(_, newValue) => setAttendanceData(prev => ({ ...prev, volunteerRating: newValue }))}
                        size="large"
                        readOnly={true}
                        sx={{ opacity: attendanceData.volunteerRating > 0 ? 1 : 0.5 }}
                      />
                      {attendanceData.volunteerRating > 0 && (
                        <Typography variant="body2" color="info.main">
                          {attendanceData.volunteerRating}/5 stars
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {attendanceData.volunteerRating > 0 
                        ? "The volunteer provided this rating for their experience" 
                        : "Record the rating the volunteer gave for their experience (if any)"
                      }
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Box mt={2} display="flex" gap={1} justifyContent="flex-end">
                <Button onClick={handleCancelEdit}>
                  Close
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveAttendance}
                  startIcon={<SaveIcon />}
                  disabled={!attendanceData.status || isReadOnly}
                >
                  Save Attendance
                </Button>
              </Box>
            </Paper>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button onClick={fetchVolunteers} variant="outlined">
            Refresh
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AttendanceDialog;