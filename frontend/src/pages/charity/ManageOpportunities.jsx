import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  CircularProgress,
  Tooltip,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Assignment as AttendanceIcon,
  CheckCircle as CloseIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import api from "../../services/api";
import { format } from "date-fns";
import VolunteerMatchingDialog from "../../components/VolunteerMatchingDialog";
import AttendanceDialog from "../../components/AttendanceDialog";
import { opportunityService } from "../../services/opportunityService";

const ManageOpportunities = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [matchResults, setMatchResults] = useState(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [charityData, setCharityData] = useState(null);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedOpportunityForAttendance, setSelectedOpportunityForAttendance] = useState(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedOpportunityForClose, setSelectedOpportunityForClose] = useState(null);
  const [closeNotes, setCloseNotes] = useState("");
  const [closeStatus, setCloseStatus] = useState("completed");

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/opportunities/charity/my-opportunities");
      setOpportunities(data.data);
    } catch (error) {
      toast.error("Failed to fetch opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/charity/profile");
        setCharityData(data.data);
      } catch (err) {
        console.error("Failed to fetch charity profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleDelete = async () => {
    // Block deletes while charity is pending review
    if (charityData?.verificationStatus === "pending") {
      toast.error(
        "Your charity profile is under review. You cannot make changes until approval is complete."
      );
      return;
    }
    try {
      await api.delete(`/opportunities/${selectedOpportunity.id}`);
      toast.success("Opportunity deleted successfully");
      setDeleteDialogOpen(false);
      fetchOpportunities();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to delete opportunity"
      );
    }
  };

  const handleFindMatches = async (opportunity) => {
    // Block finding matches while charity is pending review
    if (charityData?.verificationStatus === "pending") {
      toast.error(
        "Your charity profile is under review. You cannot make changes until approval is complete."
      );
      return;
    }
    setSelectedOpportunity(opportunity);
    setMatchLoading(true);
    setMatchDialogOpen(true);
    setMatchResults(null);

    try {
      const { data } = await api.get(
        `/opportunities/${opportunity.id}/matched-volunteers`,
        {
          params: { limit: 20, minScore: 30 },
        }
      );
      setMatchResults(data.data || null);
    } catch (error) {
      toast.error("Failed to fetch matched volunteers");
      console.error("Matching error:", error);
      setMatchResults(null);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleAttendance = (opportunity) => {
    // Block attendance tracking while charity is pending review
    if (charityData?.verificationStatus === "pending") {
      toast.error(
        "Your charity profile is under review. You cannot make changes until approval is complete."
      );
      return;
    }
    setSelectedOpportunityForAttendance(opportunity);
    setAttendanceDialogOpen(true);
  };

  const handleCloseOpportunity = (opportunity) => {
    // Block closing while charity is pending review
    if (charityData?.verificationStatus === "pending") {
      toast.error(
        "Your charity profile is under review. You cannot make changes until approval is complete."
      );
      return;
    }
    setSelectedOpportunityForClose(opportunity);
    setCloseDialogOpen(true);
    setCloseNotes("");
    setCloseStatus("completed");
  };

  const confirmCloseOpportunity = async () => {
    if (!selectedOpportunityForClose) return;

    try {
      await opportunityService.closeOpportunity(selectedOpportunityForClose.id, {
        status: closeStatus,
        notes: closeNotes
      });
      toast.success(`Opportunity ${closeStatus} successfully`);
      setCloseDialogOpen(false);
      fetchOpportunities();
    } catch (error) {
      toast.error(
        error.response?.data?.error || `Failed to ${closeStatus.replace('ed', '')} opportunity`
      );
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "default",
      published: "success",
      in_progress: "info",
      completed: "secondary",
      cancelled: "error",
    };
    return colors[status] || "default";
  };

  if (loading) {
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Manage Opportunities</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchOpportunities}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/charity/opportunities/create")}
            disabled={charityData?.verificationStatus !== "approved"}
          >
            Create New
          </Button>
        </Box>
      </Box>

      {charityData?.verificationStatus === "pending" && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your charity profile is under review. You cannot make changes until
          approval is complete.
        </Alert>
      )}

      {opportunities.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No opportunities yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first volunteering opportunity to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/charity/opportunities/create")}
            disabled={charityData?.verificationStatus !== "approved"}
          >
            Create Opportunity
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Volunteers</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {opportunities.map((opp) => (
                <TableRow key={opp.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {opp.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{opp.category}</TableCell>
                  <TableCell>
                    <Chip label={opp.locationType} size="small" />
                    {opp.city && (
                      <Typography variant="caption" display="block">
                        {opp.city}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {opp.startDate
                      ? format(new Date(opp.startDate), "MMM dd, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {opp.volunteersConfirmed || 0} / {opp.numberOfVolunteers}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={opp.status}
                      size="small"
                      color={getStatusColor(opp.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/opportunities/${opp.id}`)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Find Matched Volunteers">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleFindMatches(opp)}
                          disabled={
                            charityData?.verificationStatus !== "approved"
                          }
                        >
                          <PeopleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Track Attendance">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleAttendance(opp)}
                          disabled={
                            charityData?.verificationStatus !== "approved"
                          }
                        >
                          <AttendanceIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={`Close Opportunity`}>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleCloseOpportunity(opp)}
                          disabled={
                            charityData?.verificationStatus !== "approved" ||
                            opp.status === "completed" ||
                            opp.status === "cancelled"
                          }
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() =>
                            navigate(`/charity/opportunities/edit/${opp.id}`)
                          }
                          disabled={
                            charityData?.verificationStatus !== "approved"
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedOpportunity(opp);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={
                            charityData?.verificationStatus !== "approved"
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Opportunity</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedOpportunity?.title}"? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Matched Volunteers Dialog */}
      <VolunteerMatchingDialog
        open={matchDialogOpen}
        onClose={() => setMatchDialogOpen(false)}
        opportunity={selectedOpportunity}
        matchResults={matchResults}
        loading={matchLoading}
      />

      {/* Attendance Dialog */}
      <AttendanceDialog
        open={attendanceDialogOpen}
        onClose={() => setAttendanceDialogOpen(false)}
        opportunity={selectedOpportunityForAttendance}
      />

      {/* Close Opportunity Dialog */}
      <Dialog
        open={closeDialogOpen}
        onClose={() => setCloseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Close Opportunity</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Close "{selectedOpportunityForClose?.title}"?
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={closeStatus}
                label="Status"
                onChange={(e) => setCloseStatus(e.target.value)}
              >
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              placeholder="Add any notes about closing this opportunity..."
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmCloseOpportunity}
            color={closeStatus === "completed" ? "success" : "error"}
            variant="contained"
          >
            {closeStatus === "completed" ? "Mark Complete" : "Cancel Opportunity"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageOpportunities;
