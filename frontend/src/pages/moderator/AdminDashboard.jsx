import { useState, useEffect } from 'react';
import {
  Container,
  Box,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [charities, setCharities] = useState([]);
  const [selectedCharity, setSelectedCharity] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(1);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.data);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    }
  };

  const fetchCharities = async (status = 'pending') => {
    setLoading(true);
    try {
      const endpoint = status === 'all' ? '/admin/charities' : `/admin/charities?status=${status}`;
      const { data } = await api.get(endpoint);
      setCharities(data.data.charities);
    } catch (error) {
      toast.error('Failed to fetch charities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCharities('pending');
  }, []);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    const statusMap = ['pending', 'approved', 'rejected', 'all'];
    fetchCharities(statusMap[newValue]);
  };

  const handleViewDetails = async (charity) => {
    try {
      const { data } = await api.get(`/admin/charities/${charity.id}`);
      setSelectedCharity(data.data.charity);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Failed to fetch charity details');
    }
  };

  const handleApprove = (charity) => {
    setSelectedCharity(charity);
    setNotes('');
    setApproveDialogOpen(true);
  };

  const handleReject = (charity) => {
    setSelectedCharity(charity);
    setNotes('');
    setRejectDialogOpen(true);
  };

  const confirmApprove = async () => {
    try {
      await api.put(`/admin/charities/${selectedCharity.id}/approve`, {
        verificationNotes: notes || 'Application approved'
      });
      toast.success('Charity approved successfully');
      setApproveDialogOpen(false);
      fetchStats();
      fetchCharities(currentTab === 0 ? 'pending' : 'all');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve charity');
    }
  };

  const confirmReject = async () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      await api.put(`/admin/charities/${selectedCharity.id}/reject`, {
        verificationNotes: notes
      });
      toast.success('Charity application rejected');
      setRejectDialogOpen(false);
      fetchStats();
      fetchCharities(currentTab === 0 ? 'pending' : 'all');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject charity');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Applications
              </Typography>
              <Typography variant="h3">{stats.charities.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved Charities
              </Typography>
              <Typography variant="h3">{stats.charities.approved}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Volunteers
              </Typography>
              <Typography variant="h3">{stats.volunteers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Opportunities
              </Typography>
              <Typography variant="h3">{stats.opportunities}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charity Applications */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Pending" />
            <Tab label="Approved" />
            <Tab label="Rejected" />
            <Tab label="All" />
          </Tabs>
          <IconButton onClick={() => fetchCharities(currentTab === 0 ? 'pending' : 'all')} sx={{ mr: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Organization Name</TableCell>
                  <TableCell>Registration Number</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applied Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {charities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No charities found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  charities.map((charity) => (
                    <TableRow key={charity.id}>
                      <TableCell>{charity.organizationName}</TableCell>
                      <TableCell>{charity.registrationNumber}</TableCell>
                      <TableCell>
                        {charity.User?.firstName} {charity.User?.lastName}
                      </TableCell>
                      <TableCell>{charity.contactEmail}</TableCell>
                      <TableCell>
                        <Chip
                          label={charity.verificationStatus}
                          color={getStatusColor(charity.verificationStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(charity.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(charity)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {charity.verificationStatus === 'pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(charity)}
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleReject(charity)}
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Charity Details</DialogTitle>
        <DialogContent>
          {selectedCharity && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Organization Name
                </Typography>
                <Typography variant="body1">{selectedCharity.organizationName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Registration Number
                </Typography>
                <Typography variant="body1">{selectedCharity.registrationNumber}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Description
                </Typography>
                <Typography variant="body1">{selectedCharity.description}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Mission Statement
                </Typography>
                <Typography variant="body1">{selectedCharity.missionStatement}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Areas of Focus
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {selectedCharity.areasOfFocus?.map((area) => (
                    <Chip key={area} label={area} size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Website
                </Typography>
                <Typography variant="body1">{selectedCharity.websiteUrl || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Contact Phone
                </Typography>
                <Typography variant="body1">{selectedCharity.contactPhone}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Address
                </Typography>
                <Typography variant="body1">
                  {selectedCharity.address}, {selectedCharity.city}, {selectedCharity.state}{' '}
                  {selectedCharity.postalCode}, {selectedCharity.country}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Contact Person
                </Typography>
                <Typography variant="body1">
                  {selectedCharity.User?.firstName} {selectedCharity.User?.lastName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Contact Email
                </Typography>
                <Typography variant="body1">{selectedCharity.contactEmail}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={selectedCharity.verificationStatus}
                  color={getStatusColor(selectedCharity.verificationStatus)}
                  sx={{ mt: 1 }}
                />
              </Grid>
              {selectedCharity.verificationNotes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Admin Notes
                  </Typography>
                  <Typography variant="body1">{selectedCharity.verificationNotes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>Approve Charity Application</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to approve {selectedCharity?.organizationName}?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmApprove} variant="contained" color="success">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Charity Application</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting {selectedCharity?.organizationName}:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Rejection *"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmReject} variant="contained" color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
