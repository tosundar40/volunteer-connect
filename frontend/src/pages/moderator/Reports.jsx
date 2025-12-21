import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Assessment as StatsIcon,
  OpenInNew as OpenIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { getAllReports, updateReportStatus, getReportStats } from '../../services/reportService';

const ENTITY_TYPE_LABELS = {
  user: 'User',
  charity: 'Charity',
  opportunity: 'Opportunity',
  comment: 'Comment'
};

const REASON_LABELS = {
  inappropriate_content: 'Inappropriate Content',
  spam: 'Spam',
  harassment: 'Harassment',
  false_information: 'False Information',
  safety_concern: 'Safety Concern',
  other: 'Other'
};

const STATUS_COLORS = {
  pending: 'warning',
  under_review: 'info',
  resolved: 'success',
  dismissed: 'default'
};

const Reports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [moderatorActionOpen, setModeratorActionOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    reportedEntityType: '',
    reason: ''
  });

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [page, rowsPerPage, filters]);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAllReports({
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      });
      setReports(response.data.reports);
      setTotalReports(response.count);
    } catch (err) {
      setError('Failed to fetch reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getReportStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedReport(null);
  };

  const handleOpenModeratorAction = (report) => {
    setSelectedReport(report);
    setModeratorActionOpen(true);
  };

  const handleCloseModeratorAction = () => {
    setModeratorActionOpen(false);
    setSelectedReport(null);
  };

  const handleStatusUpdate = async (status, resolution, actionTaken) => {
    try {
      await updateReportStatus(selectedReport.id, {
        status,
        resolution,
        actionTaken
      });
      
      // Refresh reports
      await fetchReports();
      await fetchStats();
      handleCloseModeratorAction();
    } catch (err) {
      setError('Failed to update report status');
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      reportedEntityType: '',
      reason: ''
    });
    setPage(0);
  };

  const handleViewContent = (report) => {
    const { reportedEntityType, reportedEntityId } = report;
    
    switch (reportedEntityType) {
      case 'user':
        // Navigate to volunteer profile
        navigate(`/volunteer/profile/${reportedEntityId}`);
        break;
      case 'charity':
        // Navigate to charity profile
        navigate(`/charity/profile/${reportedEntityId}`);
        break;
      case 'opportunity':
        // Navigate to opportunity details
        navigate(`/opportunities/${reportedEntityId}`);
        break;
      case 'comment':
        // For comments, show an alert or implement custom logic
        alert('Comment viewing will be implemented based on your comment system');
        break;
      default:
        alert('Unable to view this content type');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Reports Management
          </Typography>
          <Button
            variant="outlined"
            startIcon={<StatsIcon />}
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide' : 'Show'} Statistics
          </Button>
        </Box>

        {/* Statistics */}
        {showStats && stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Reports
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalReports}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Pending
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.pendingReports}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Under Review
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.underReviewReports}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Resolved
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.resolvedReports}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Dismissed
                  </Typography>
                  <Typography variant="h4">
                    {stats.dismissedReports}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterIcon />
            <TextField
              select
              label="Status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="under_review">Under Review</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="dismissed">Dismissed</MenuItem>
            </TextField>

            <TextField
              select
              label="Entity Type"
              name="reportedEntityType"
              value={filters.reportedEntityType}
              onChange={handleFilterChange}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="charity">Charity</MenuItem>
              <MenuItem value="opportunity">Opportunity</MenuItem>
              <MenuItem value="comment">Comment</MenuItem>
            </TextField>

            <TextField
              select
              label="Reason"
              name="reason"
              value={filters.reason}
              onChange={handleFilterChange}
              size="small"
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All</MenuItem>
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>

            <Button onClick={handleClearFilters} size="small">
              Clear Filters
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Reports Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Reported Entity</TableCell>
                <TableCell>Reporter</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No reports found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {report.entityDetails?.name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ENTITY_TYPE_LABELS[report.reportedEntityType]}
                          {report.entityDetails?.charityName && ` • ${report.entityDetails.charityName}`}
                        </Typography>
                        
                      </Box>
                    </TableCell>
                    <TableCell>
                      {report.reporter ? (
                        <Box>
                          <Typography variant="body2">
                            {report.reporter.firstName} {report.reporter.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.reporter.role}
                          </Typography>
                        </Box>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={REASON_LABELS[report.reason] || report.reason} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={(report.status || '').replace('_', ' ')} 
                        color={STATUS_COLORS[report.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatDate(report.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="View Report Details">
                          <IconButton
                            onClick={() => handleViewDetails(report)}
                            size="small"
                            color="primary"
                            sx={{ p: 0.4, width: 34, height: 34 }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Moderator Actions">
                          <IconButton
                            onClick={() => handleOpenModeratorAction(report)}
                            size="small"
                            color="success"
                            sx={{ p: 0.4, width: 34, height: 34 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {report.reportedEntityType === 'opportunity' && (
                          <Tooltip title="View Reported Content">
                            <IconButton
                              onClick={() => handleViewContent(report)}
                              size="small"
                              color="secondary"
                              sx={{ p: 0.4, width: 34, height: 34 }}
                            >
                              <OpenIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalReports}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      </Box>

      {/* View Report Details Dialog */}
      <ViewReportDetailsDialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        report={selectedReport}
      />

      {/* Moderator Actions Dialog */}
      <ModeratorActionsDialog
        open={moderatorActionOpen}
        onClose={handleCloseModeratorAction}
        report={selectedReport}
        onStatusUpdate={handleStatusUpdate}
      />
    </Container>
  );
};

// View Report Details Dialog Component (Read-only)
const ViewReportDetailsDialog = ({ open, onClose, report }) => {
  if (!report) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Report Details</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {/* Reported Entity Information Box */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              mb: 3, 
              bgcolor: 'error.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'error.200'
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Reported {ENTITY_TYPE_LABELS[report.reportedEntityType]}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {report.entityDetails?.name || 'Not available'}
            </Typography>
            {report.entityDetails?.email && (
              <Typography variant="body2" color="text.secondary">
                {report.entityDetails.email}
              </Typography>
            )}
            {report.entityDetails?.charityName && (
              <Typography variant="body2" color="text.secondary">
                Charity: {report.entityDetails.charityName}
              </Typography>
            )}
          </Paper>

          {/* Report Information */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Reporter
                </Typography>
                <Typography variant="body1">
                  {report.reporter?.firstName} {report.reporter?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {report.reporter?.role}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Submitted Date
                </Typography>
                <Typography variant="body1">
                  {new Date(report.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Reason
                </Typography>
                <Chip 
                  label={REASON_LABELS[report.reason]} 
                  size="small"
                  variant="outlined"
                  color="error"
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Current Status
                </Typography>
                <Chip 
                  label={report.status.replace('_', ' ')} 
                  color={STATUS_COLORS[report.status]}
                  size="small"
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                  Report Description
                </Typography>
                <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {report.description}
                  </Typography>
                </Paper>
              </Box>
            </Grid>

            {/* Show Resolution Notes if available */}
            {report.resolution && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                    Resolution Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'success.50' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {report.resolution}
                    </Typography>
                  </Paper>
                </Box>
              </Grid>
            )}

            {/* Show Action Taken if available */}
            {report.actionTaken && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Action Taken
                  </Typography>
                  <Typography variant="body1">
                    {report.actionTaken}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, bgcolor: 'grey.50' }}>
        <Button onClick={onClose} size="large">
          Close
        </Button>
        {report.reportedEntityType === 'opportunity' && (
          <Button
            variant="outlined"
            startIcon={<OpenIcon />}
            onClick={() => {
              window.open(`/opportunities/${report.reportedEntityId}`, '_blank');
            }}
            size="large"
          >
            View Opportunity
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Moderator Actions Dialog Component
const ModeratorActionsDialog = ({ open, onClose, report, onStatusUpdate }) => {
  const [status, setStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (report) {
      setStatus(report.status);
      setResolution(report.resolution || '');
      setActionTaken(report.actionTaken || '');
    }
  }, [report]);

  const handleSubmit = async () => {
    setUpdating(true);
    try {
      await onStatusUpdate(status, resolution, actionTaken);
    } finally {
      setUpdating(false);
    }
  };

  if (!report) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Moderator Actions</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {/* Report Summary */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2.5, 
              mb: 3, 
              bgcolor: 'grey.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.300'
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Report Summary
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {report.entityDetails?.name || 'Unknown'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ENTITY_TYPE_LABELS[report.reportedEntityType]} • {REASON_LABELS[report.reason]}
            </Typography>
          </Paper>

          {/* Current Status Display */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Current Status
            </Typography>
            <Chip 
              label={report.status.replace('_', ' ')} 
              color={STATUS_COLORS[report.status]}
              size="medium"
            />
          </Box>

          {/* Update Form */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Update Status
            </Typography>
            <TextField
              select
              fullWidth
              label="Select Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="under_review">Under Review</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="dismissed">Dismissed</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Resolution Notes
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Document your resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Explain how this report was resolved..."
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Action Taken
            </Typography>
            <TextField
              fullWidth
              label="What action was taken?"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g., Warning issued, Content removed, Account suspended"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, bgcolor: 'grey.50' }}>
        <Button onClick={onClose} size="large">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={updating}
          size="large"
          startIcon={updating && <CircularProgress size={20} />}
        >
          {updating ? 'Updating...' : 'Update Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Reports;
