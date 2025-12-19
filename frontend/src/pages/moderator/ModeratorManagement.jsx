import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Tabs, Tab, Box, Card, CardContent,
  Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, CircularProgress,
  Grid, Stack, Divider, Select, MenuItem, FormControl, InputLabel, Pagination,
  InputAdornment
  , Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon, Block as BlockIcon,
  DeleteForever as DeleteForeverIcon,
  VerifiedUser as VerifiedIcon, Warning as WarningIcon,
  Group as GroupIcon, Business as BusinessIcon,
  CheckCircle, Cancel, ListAlt as ListIcon,
  Search as SearchIcon, Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { moderatorService } from '../../services/moderatorService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`moderator-tabpanel-${index}`}
      aria-labelledby={`moderator-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ModeratorManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [charities, setCharities] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  // Charities filters & pagination
  const [charityQuery, setCharityQuery] = useState('');
  const [charityStatus, setCharityStatus] = useState('all');
  const [charityActiveStatus, setCharityActiveStatus] = useState('all');
  const [charityPage, setCharityPage] = useState(1);
  const [charityPageSize] = useState(10);
  const [charityTotal, setCharityTotal] = useState(0);
  // Volunteers filters & pagination
  const [volQuery, setVolQuery] = useState('');
  const [volStatus, setVolStatus] = useState('all');
  const [volActiveStatus, setVolActiveStatus] = useState('all');
  const [volPage, setVolPage] = useState(1);
  const [volPageSize] = useState(10);
  const [volTotal, setVolTotal] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'charity' or 'volunteer'
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({});
  const [viewDialog, setViewDialog] = useState(false);
  const [viewType, setViewType] = useState('');
  const [viewDetails, setViewDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalType, setApprovalType] = useState(''); // 'approve' or 'reject'
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approvalTargetType, setApprovalTargetType] = useState(''); // 'volunteer' or 'charity'
  const [approving, setApproving] = useState(false);
  const [volunteerAppsDialog, setVolunteerAppsDialog] = useState(false);
  const [volunteerApplications, setVolunteerApplications] = useState([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [loadingVolunteerApps, setLoadingVolunteerApps] = useState(false);
  // Reusable confirm action dialog (used for reactivate actions)
  const [confirmActionOpen, setConfirmActionOpen] = useState(false);
  const [confirmActionItem, setConfirmActionItem] = useState(null);
  const [confirmActionType, setConfirmActionType] = useState(''); // 'charity_activate' | 'volunteer_activate'
  const [confirmActionLoading, setConfirmActionLoading] = useState(false);

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const response = await moderatorService.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Open confirm dialog for reactivate actions
  const handleActivateCharity = (charity) => {
    setConfirmActionItem(charity);
    setConfirmActionType('charity_activate');
    setConfirmActionOpen(true);
  };

  const handleActivateVolunteer = (volunteer) => {
    setConfirmActionItem(volunteer);
    setConfirmActionType('volunteer_activate');
    setConfirmActionOpen(true);
  };

  const performConfirmAction = async () => {
    if (!confirmActionItem || !confirmActionType) return;
    try {
      setConfirmActionLoading(true);
      if (confirmActionType === 'charity_activate') {
        await moderatorService.activateCharity(confirmActionItem.id);
        toast.success('Charity reactivated successfully');
        fetchCharities();
      } else if (confirmActionType === 'volunteer_activate') {
        await moderatorService.activateVolunteer(confirmActionItem.id);
        toast.success('Volunteer reactivated successfully');
        fetchVolunteers();
      }
      fetchStats();
      setConfirmActionOpen(false);
      setConfirmActionItem(null);
      setConfirmActionType('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to perform action');
      console.error('Confirm action error:', error);
    } finally {
      setConfirmActionLoading(false);
    }
  };

  // Fetch charities
  const fetchCharities = async () => {
    try {
      setLoading(true);
      const params = {
        page: charityPage,
        limit: charityPageSize,
      };
        if (charityQuery) params.search = charityQuery;
      if (charityStatus && charityStatus !== 'all') params.verificationStatus = charityStatus;
      if (charityActiveStatus && charityActiveStatus !== 'all') params.active = charityActiveStatus;

      const response = await moderatorService.getCharitiesForReview(params);
      
      // Handle new backend response format
      if (response?.data) {
        setCharities(response.data);
        setCharityTotal(response.total || response.count || 0);
      } else if (response?.charities) {
        setCharities(response.charities);
        setCharityTotal(response.total || response.count || 0);
      } else {
        setCharities(response || []);
        setCharityTotal((response && response.length) || 0);
      }
    } catch (error) {
      toast.error('Failed to load charities');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch volunteers
  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const params = {
        page: volPage,
        limit: volPageSize,
      };
      if (volQuery) params.search = volQuery;
      if (volStatus && volStatus !== 'all') params.status = volStatus;
      if (volActiveStatus && volActiveStatus !== 'all') params.active = volActiveStatus;

      const response = await moderatorService.getVolunteersForReview(params);
      
      // Handle new backend response format
      if (response?.data) {
        setVolunteers(response.data);
        setVolTotal(response.total || response.count || 0);
      } else if (response?.volunteers) {
        setVolunteers(response.volunteers);
        setVolTotal(response.total || response.count || 0);
      } else {
        setVolunteers(response || []);
        setVolTotal((response && response.length) || 0);
      }
    } catch (error) {
      toast.error('Failed to load volunteers');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (tabValue === 0) {
      fetchCharities();
    } else if (tabValue === 1) {
      fetchVolunteers();
    }
  }, [tabValue]);

  // Refetch when filters or pages change
  useEffect(() => {
    if (tabValue === 0) fetchCharities();
  }, [charityPage, charityQuery, charityStatus, charityActiveStatus]);

  useEffect(() => {
    if (tabValue === 1) fetchVolunteers();
  }, [volPage, volQuery, volStatus, volActiveStatus]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // const handleCharitySearch = () => {
  //   setCharityPage(1);
  //   fetchCharities();
  // };

  const handleCharityClear = () => {
    setCharityQuery('');
    setCharityStatus('all');
    setCharityActiveStatus('all');
    setCharityPage(1);
    // Delay fetch to allow state to update
    setTimeout(() => {
      fetchCharities();
    }, 100);
  };

  const handleVolSearch = () => {
    setVolPage(1);
    fetchVolunteers();
  };

  const handleVolClear = () => {
    setVolQuery('');
    setVolStatus('all');
    setVolActiveStatus('all');
    setVolPage(1);
    // Delay fetch to allow state to update
    setTimeout(() => {
      fetchVolunteers();
    }, 100);
  };

  // Handle Enter key for search
  const handleCharityKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleCharitySearch();
    }
  };

  const handleVolKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleVolSearch();
    }
  };

  // Handle view details
  const handleViewDetails = async (item, type) => {
    try {
      setLoadingDetails(true);
      setViewType(type);
      setViewDialog(true);
      
      let response;
      if (type === 'charity') {
        response = await moderatorService.getCharityDetails(item.id);
      } else if (type === 'volunteer') {
        response = await moderatorService.getVolunteerDetails(item.id);
      }
      
      setViewDetails(response.data);
    } catch (error) {
      toast.error(`Failed to load ${type} details`);
      console.error('Error:', error);
      setViewDialog(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle delete
  const handleDelete = (item, type) => {
    setSelectedItem(item);
    setDeleteType(type);
    setDeleteDialog(true);
  };

  // Handle permanent hard delete
  const handleHardDelete = (item, type) => {
    setSelectedItem(item);
    setDeleteType(type === 'charity' ? 'charity_hard' : 'volunteer_hard');
    setDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      setDeleting(true);
      if (deleteType === 'charity') {
        // Soft-delete / deactivate
        await moderatorService.deleteCharity(selectedItem.id);
        toast.success('Charity deactivated successfully');
        fetchCharities();
      } else if (deleteType === 'volunteer') {
        // Soft-delete / deactivate
        await moderatorService.deleteVolunteer(selectedItem.id);
        toast.success('Volunteer deactivated successfully');
        fetchVolunteers();
      } else if (deleteType === 'charity_hard') {
        // Permanent delete
        await moderatorService.hardDeleteCharity(selectedItem.id);
        toast.success('Charity permanently deleted');
        fetchCharities();
      } else if (deleteType === 'volunteer_hard') {
        // Permanent delete
        await moderatorService.hardDeleteVolunteer(selectedItem.id);
        toast.success('Volunteer permanently deleted');
        fetchVolunteers();
      }
      
      setDeleteDialog(false);
      setSelectedItem(null);
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to delete ${deleteType}`);
    } finally {
      setDeleting(false);
    }
  };

  // Handle approval/rejection for volunteers or charities
  const handleApproval = (item, type, entity = 'volunteer') => {
    setApprovalTarget(item);
    setApprovalTargetType(entity);
    setApprovalType(type);
    setApprovalNotes('');
    setApprovalDialog(true);
  };

  // Handle view volunteer applications
  const handleViewVolunteerApplications = async (volunteer) => {
    try {
      setLoadingVolunteerApps(true);
      setSelectedVolunteer(volunteer);
      setVolunteerAppsDialog(true);
      
      // Fetch volunteer applications with hours worked
      const response = await moderatorService.getVolunteerApplications(volunteer.id);
      setVolunteerApplications(response.data || response || []);
    } catch (error) {
      toast.error('Failed to load volunteer applications');
      console.error('Error:', error);
      setVolunteerAppsDialog(false);
    } finally {
      setLoadingVolunteerApps(false);
    }
  };

  
  // Confirm approval/rejection
  const confirmApproval = async () => {
    try {
      setApproving(true);
      if (approvalTargetType === 'volunteer') {
        if (approvalType === 'approve') {
          await moderatorService.approveVolunteer(approvalTarget.id, { notes: approvalNotes });
          toast.success('Volunteer approved successfully');
        } else if (approvalType === 'reject') {
          if (!approvalNotes.trim()) {
            toast.error('Rejection notes are required');
            return;
          }
          await moderatorService.rejectVolunteer(approvalTarget.id, { notes: approvalNotes });
          toast.success('Volunteer rejected successfully');
        }
        // Refresh volunteers list
        fetchVolunteers();
      } else if (approvalTargetType === 'charity') {
        // Use reviewCharity endpoint to set verificationStatus
        const reviewData = {
          verificationStatus: approvalType === 'approve' ? 'approved' : 'rejected',
          reviewNotes: approvalNotes
        };
        await moderatorService.reviewCharity(approvalTarget.id, reviewData);
        toast.success(`Charity ${approvalType === 'approve' ? 'approved' : 'rejected'} successfully`);
        // Refresh charities list
        fetchCharities();
      }

      setApprovalDialog(false);
      setApprovalTarget(null);
      setApprovalTargetType('');
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${approvalType}`);
    } finally {
      setApproving(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusMap = {
      pending: { label: 'Pending', color: 'warning' },
      verified: { label: 'Verified', color: 'success' },
      rejected: { label: 'Rejected', color: 'error' },
      approved: { label: 'Approved', color: 'success' }
    };

    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Stats cards
  const StatsCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Moderator Management
      </Typography>
      
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Charity Verifications"
            value={stats.pendingCharityVerifications || 0}
            icon={<BusinessIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Pending Volunteer Verifications"
            value={stats.pendingVolunteerVerifications || 0}
            icon={<GroupIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Flagged Applications"
            value={stats.flaggedApplications || 0}
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Background Checks Pending"
            value={stats.pendingBackgroundChecks || 0}
            icon={<VerifiedIcon />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Manage Charities" />
            <Tab label="Manage Volunteers" />
          </Tabs>
        </Box>

        {/* Charities Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Charity Management</Typography>
            
            {/* Search and Filter Controls */}
            <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField 
                    size="small" 
                    fullWidth
                    label="Search Organization, Email, or Registration" 
                    placeholder="Type to search..."
                    value={charityQuery} 
                    onChange={(e) => setCharityQuery(e.target.value)}
                    onKeyPress={handleCharityKeyPress}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: charityQuery && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setCharityQuery('')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Verification Status</InputLabel>
                    <Select 
                      value={charityStatus} 
                      label="Verification Status" 
                      onChange={(e) => setCharityStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Active</InputLabel>
                    <Select
                      value={charityActiveStatus}
                      label="Active"
                      onChange={(e) => setCharityActiveStatus(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {/* <Button 
                      variant="contained" 
                      startIcon={<SearchIcon />}
                      onClick={handleCharitySearch}
                      disabled={loading}
                    >
                      Search
                    </Button> */}
                    <Button 
                      variant="outlined" 
                      startIcon={<ClearIcon />}
                      onClick={handleCharityClear}
                      disabled={loading}
                    >
                      Clear Filters
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<RefreshIcon />}
                      onClick={fetchCharities}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Results Summary */}
              {!loading && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">
                    {charityTotal === 0 ? 'No charities found' : 
                     `Showing ${((charityPage - 1) * charityPageSize) + 1}-${Math.min(charityPage * charityPageSize, charityTotal)} of ${charityTotal} charities`}
                    {(charityQuery || charityStatus !== 'all') && 
                     ` (filtered${charityQuery ? ` by "${charityQuery}"` : ''}${charityStatus !== 'all' ? ` - ${charityStatus} status` : ''})`}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Organization Name</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Contact Email</TableCell>
                    <TableCell>Registration Number</TableCell>
                    <TableCell>Verification Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {charities.map((charity) => (
                    <TableRow key={charity.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {charity.organizationName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={charity.isActive ? 'Active' : 'Inactive'} color={charity.isActive ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>{charity.user?.email}</TableCell>
                      <TableCell>{charity.registrationNumber}</TableCell>
                      <TableCell>
                        <StatusBadge status={charity.verificationStatus} />
                      </TableCell>
                      <TableCell>
                        {format(new Date(charity.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(charity, 'charity')}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Opportunities">
                          <IconButton
                            size="small"
                            color="info"
                            component={Link}
                            to={`/moderator/charities/${charity.id}/opportunities`}
                            title="View Opportunities"
                          >
                            <ListIcon />
                          </IconButton>
                          </Tooltip>
                          {charity.verificationStatus === 'pending' && (
                            <>
                              <Tooltip title="Approve Charity">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproval(charity, 'approve', 'charity')}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject Charity">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleApproval(charity, 'reject', 'charity')}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                             {charity.isActive && (
                          <Tooltip title="Deactivate Charity">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(charity, 'charity')}
                            >
                              <BlockIcon />
                            </IconButton>
                          </Tooltip>
)}
                            {!charity.isActive && (
                            <Tooltip title="Reactivate Charity">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleActivateCharity(charity)}
                              >
                                <VerifiedIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Permanently Delete Charity">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleHardDelete(charity, 'charity')}
                            >
                              <DeleteForeverIcon />
                            </IconButton>
                          </Tooltip>
                        
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {charities.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No charities found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination count={Math.max(1, Math.ceil(charityTotal / charityPageSize))} page={charityPage} onChange={(e, p) => setCharityPage(p)} color="primary" />
          </Box>
        </TabPanel>

        {/* Volunteers Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Volunteer Management</Typography>
            
            {/* Search and Filter Controls */}
            <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField 
                    size="small" 
                    fullWidth
                    label="Search Name or Email" 
                    placeholder="Type to search..."
                    value={volQuery} 
                    onChange={(e) => setVolQuery(e.target.value)}
                    onKeyPress={handleVolKeyPress}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: volQuery && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setVolQuery('')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Approval Status</InputLabel>
                    <Select 
                      value={volStatus} 
                      label="Approval Status" 
                      onChange={(e) => setVolStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Active</InputLabel>
                    <Select
                      value={volActiveStatus}
                      label="Active"
                      onChange={(e) => setVolActiveStatus(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {/* <Button 
                      variant="contained" 
                      startIcon={<SearchIcon />}
                      onClick={handleVolSearch}
                      disabled={loading}
                    >
                      Search
                    </Button> */}
                    <Button 
                      variant="outlined" 
                      startIcon={<ClearIcon />}
                      onClick={handleVolClear}
                      disabled={loading}
                    >
                      Clear Filters
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<RefreshIcon />}
                      onClick={fetchVolunteers}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Results Summary */}
              {!loading && (
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">
                    {volTotal === 0 ? 'No volunteers found' : 
                     `Showing ${((volPage - 1) * volPageSize) + 1}-${Math.min(volPage * volPageSize, volTotal)} of ${volTotal} volunteers`}
                    {(volQuery || volStatus !== 'all') && 
                     ` (filtered${volQuery ? ` by "${volQuery}"` : ''}${volStatus !== 'all' ? ` - ${volStatus} status` : ''})`}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Background Check</TableCell>
                    <TableCell>Approval Status</TableCell>
                    <TableCell>Total Hours</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {volunteers.map((volunteer) => (
                    <TableRow key={volunteer.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {volunteer.user?.firstName} {volunteer.user?.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={volunteer.isActive ? 'Active' : 'Inactive'} color={volunteer.isActive ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>{volunteer.user?.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={volunteer.backgroundCheckStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={volunteer.approvalStatus || 'pending'} />
                      </TableCell>
                      <TableCell>{volunteer.totalHoursVolunteered || 0} hrs</TableCell>
                      <TableCell>
                        {format(new Date(volunteer.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewDetails(volunteer, 'volunteer')}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Applications">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewVolunteerApplications(volunteer)}
                            title="View Applications"
                          >
                            <ListIcon />
                          </IconButton>
                          </Tooltip>
                          {volunteer.approvalStatus === 'pending' && (
                            <>
                              <Tooltip title="Approve Volunteer">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproval(volunteer, 'approve')}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject Volunteer">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleApproval(volunteer, 'reject')}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                             {volunteer.isActive && (
                          <Tooltip title="Deactivate Volunteer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(volunteer, 'volunteer')}
                            >
                              <BlockIcon />
                            </IconButton>
                          </Tooltip>
                           )}
                                {!volunteer.isActive && (
                            <Tooltip title="Reactivate Volunteer">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleActivateVolunteer(volunteer)}
                              >
                                <VerifiedIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Permanently Delete Volunteer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleHardDelete(volunteer, 'volunteer')}
                            >
                              <DeleteForeverIcon />
                            </IconButton>
                          </Tooltip>
                    
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {volunteers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No volunteers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination count={Math.max(1, Math.ceil(volTotal / volPageSize))} page={volPage} onChange={(e, p) => setVolPage(p)} color="primary" />
          </Box>
        </TabPanel>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{deleteType && deleteType.includes('_hard') ? 'Confirm Permanent Delete' : 'Confirm Deactivation'}</DialogTitle>
            <DialogContent>
              <Alert severity={deleteType && deleteType.includes('_hard') ? 'error' : 'warning'} sx={{ mb: 2 }}>
                {deleteType && deleteType.includes('_hard')
                  ? 'This action will permanently DELETE the account and cannot be undone.'
                  : 'This action will deactivate the account. It can be reactivated by a moderator.'}
              </Alert>

              <Typography variant="body1">
                Are you sure you want to {deleteType && deleteType.includes('_hard') ? 'permanently delete' : 'deactivate'}{' '}
                <strong>
                  {deleteType === 'charity' || deleteType === 'charity_hard'
                    ? selectedItem?.organizationName
                    : `${selectedItem?.user?.firstName || ''} ${selectedItem?.user?.lastName || ''}`}
                </strong>
                ?
              </Typography>

              {(deleteType === 'charity' || deleteType === 'charity_hard') && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This will also affect all associated opportunities.
                </Typography>
              )}

              {(deleteType === 'volunteer' || deleteType === 'volunteer_hard') && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This will also affect any active applications.
                </Typography>
              )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Processing...' : (deleteType && deleteType.includes('_hard') ? 'Delete' : 'Deactivate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivate Confirmation Dialog */}
      <Dialog open={confirmActionOpen} onClose={() => setConfirmActionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Reactivation</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will restore the account and allow the user to access the platform again.
          </Alert>
          <Typography variant="body1">
            Are you sure you want to reactivate{' '}
            <strong>
              {confirmActionType === 'charity_activate'
                ? confirmActionItem?.organizationName
                : `${confirmActionItem?.user?.firstName || ''} ${confirmActionItem?.user?.lastName || ''}`}
            </strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmActionOpen(false)}>Cancel</Button>
          <Button 
            onClick={performConfirmAction} 
            color="success" 
            variant="contained"
            disabled={confirmActionLoading}
          >
            {confirmActionLoading ? 'Processing...' : 'Reactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewType === 'charity' ? 'Charity Details' : 'Volunteer Details'}
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : viewDetails && (
            <Box sx={{ mt: 2 }}>
              {viewType === 'charity' && (
                <Stack spacing={3}>
                  {/* Basic Information */}
                  <Box>
                    <Typography variant="h6" gutterBottom color="primary">
                      Organization Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Organization Name
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.charity.organizationName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Registration Number
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.charity.registrationNumber}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.charity.description || 'No description provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Mission Statement
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.charity.missionStatement || 'No mission statement provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Areas of Focus
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {viewDetails.charity.areasOfFocus?.map((area, index) => (
                            <Chip key={index} label={area} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Contact Information */}
                  <Box>
                    <Typography variant="h6" gutterBottom color="primary">
                      Contact Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Contact Person
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.charity.user?.firstName} {viewDetails.charity.user?.lastName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.charity.user?.email}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.charity.user?.phone || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Website
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.charity.websiteUrl || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Verification Status
                        </Typography>
                        <StatusBadge status={viewDetails.charity.verificationStatus} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Member Since
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(viewDetails.charity.createdAt), 'PPP')}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Statistics */}
                  <Box>
                    <Typography variant="h6" gutterBottom color="primary">
                      Activity Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Active Opportunities
                        </Typography>
                        <Typography variant="h6">
                          {viewDetails.opportunities?.length || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Recent Applications
                        </Typography>
                        <Typography variant="h6">
                          {viewDetails.recentApplications?.length || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Rating
                        </Typography>
                        <Typography variant="h6">
                          {viewDetails.charity.rating || 0}/5
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Recent Opportunities */}
                  {viewDetails.opportunities && viewDetails.opportunities.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom color="primary">
                        Recent Opportunities
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Title</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Volunteers</TableCell>
                              <TableCell>Created</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {viewDetails.opportunities.map((opp) => (
                              <TableRow key={opp.id}>
                                <TableCell>{opp.title}</TableCell>
                                <TableCell>
                                  <StatusBadge status={opp.status} />
                                </TableCell>
                                <TableCell>
                                  {opp.volunteersConfirmed}/{opp.numberOfVolunteers}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(opp.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Stack>
              )}

              {viewType === 'volunteer' && (
                <Stack spacing={3}>
                  {/* Basic Information */}
                  <Box>
                    <Typography variant="h6" gutterBottom color="primary">
                      Personal Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Full Name
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.volunteer.user?.firstName} {viewDetails.volunteer.user?.lastName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.volunteer.user?.email}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.volunteer.user?.phone || 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Date of Birth
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.volunteer.dateOfBirth 
                            ? format(new Date(viewDetails.volunteer.dateOfBirth), 'PPP')
                            : 'Not provided'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Bio
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.volunteer.bio || 'No bio provided'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Skills & Interests */}
                  <Box>
                    <Typography variant="h6" gutterBottom color="primary">
                      Skills & Interests
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Skills
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {viewDetails.volunteer.skills?.map((skill, index) => (
                            <Chip key={index} label={skill} size="small" color="primary" variant="outlined" />
                          ))}
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Interests
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {viewDetails.volunteer.interests?.map((interest, index) => (
                            <Chip key={index} label={interest} size="small" color="secondary" variant="outlined" />
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Verification & Background */}
                  <Box>
                    <Typography variant="h6" gutterBottom color="primary">
                      Verification Status
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Verification Status
                        </Typography>
                        <StatusBadge status={viewDetails.volunteer.approvalStatus || 'pending'} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Background Check
                        </Typography>
                        <StatusBadge status={viewDetails.volunteer.backgroundCheckStatus} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Approval Status
                        </Typography>
                        <StatusBadge status={viewDetails.volunteer.approvalStatus || 'pending'} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Member Since
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(viewDetails.volunteer.createdAt), 'PPP')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Hours Volunteered
                        </Typography>
                        <Typography variant="body1">
                          {viewDetails.volunteer.totalHoursVolunteered || 0} hours
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Application History */}
                  {viewDetails.applicationHistory && viewDetails.applicationHistory.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom color="primary">
                        Recent Application History
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Opportunity</TableCell>
                              <TableCell>Charity</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Applied Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {viewDetails.applicationHistory.map((app, index) => (
                              <TableRow key={index}>
                                <TableCell>{app.opportunity?.title}</TableCell>
                                <TableCell>{app.opportunity?.charity?.name}</TableCell>
                                <TableCell>
                                  <StatusBadge status={app.status} />
                                </TableCell>
                                <TableCell>
                                  {format(new Date(app.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Volunteer Approval/Rejection Dialog */}
      <Dialog 
        open={approvalDialog} 
        onClose={() => setApprovalDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {approvalTargetType === 'charity'
            ? (approvalType === 'approve' ? 'Approve Charity' : 'Reject Charity')
            : (approvalType === 'approve' ? 'Approve Volunteer' : 'Reject Volunteer')
          }
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {approvalTargetType === 'charity'
              ? (approvalType === 'approve'
                  ? `Are you sure you want to approve the charity "${approvalTarget?.organizationName}"?`
                  : `Are you sure you want to reject the charity "${approvalTarget?.organizationName}"?`)
              : (approvalType === 'approve'
                  ? `Are you sure you want to approve ${approvalTarget?.user?.firstName} ${approvalTarget?.user?.lastName}?`
                  : `Are you sure you want to reject ${approvalTarget?.user?.firstName} ${approvalTarget?.user?.lastName}?`)
            }
          </Typography>

          <TextField
            autoFocus
            margin="dense"
            label={approvalType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder={
              approvalType === 'approve' 
                ? 'Add any notes about the approval...'
                : 'Please provide a reason for rejection...'
            }
            required={approvalType === 'reject'}
            error={approvalType === 'reject' && !approvalNotes.trim()}
            helperText={
              approvalType === 'reject' && !approvalNotes.trim() 
                ? 'Rejection reason is required'
                : ''
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmApproval}
            variant="contained"
            color={approvalType === 'approve' ? 'success' : 'error'}
            disabled={approving || (approvalType === 'reject' && !approvalNotes.trim())}
          >
            {approving ? <CircularProgress size={20} /> : (
              approvalType === 'approve' ? 'Approve' : 'Reject'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Volunteer Applications Dialog */}
      <Dialog open={volunteerAppsDialog} onClose={() => setVolunteerAppsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Applications by {selectedVolunteer?.user?.firstName} {selectedVolunteer?.user?.lastName}
        </DialogTitle>
        <DialogContent>
          {loadingVolunteerApps ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* Summary Statistics */}
              <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Applications
                    </Typography>
                    <Typography variant="h6">
                      {volunteerApplications.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Hours Worked
                    </Typography>
                    <Typography variant="h6">
                      {selectedVolunteer?.totalHoursVolunteered || 0} hours
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Accepted Applications
                    </Typography>
                    <Typography variant="h6">
                      {volunteerApplications.filter(app => app.status === 'accepted').length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Pending Applications
                    </Typography>
                    <Typography variant="h6">
                      {volunteerApplications.filter(app => app.status === 'pending').length}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Applications Table */}
              {volunteerApplications.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Opportunity</TableCell>
                        <TableCell>Charity</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Hours Committed</TableCell>
                        <TableCell>Hours Worked</TableCell>
                        <TableCell>Applied Date</TableCell>
                        <TableCell>Start Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {volunteerApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {application.opportunity?.title}
                            </Typography>
                            {application.opportunity?.description && (
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {application.opportunity.description.substring(0, 50)}...
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {application.opportunity?.charity?.organizationName || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={application.opportunity?.category || 'N/A'} 
                              size="small" 
                              variant="outlined" 
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={application.status} />
                          </TableCell>
                          <TableCell>
                            {application.hoursCommitted || 0} hrs
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color={application.hoursWorked > 0 ? 'success.main' : 'text.secondary'}>
                              {application.hoursWorked || 0} hrs
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {format(new Date(application.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {application.opportunity?.startDate ? 
                              format(new Date(application.opportunity.startDate), 'MMM dd, yyyy') : 'TBD'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No applications found for this volunteer.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVolunteerAppsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModeratorManagement;