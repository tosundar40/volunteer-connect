import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, Grid, Stack, Divider,
  Alert, CircularProgress, TextField, FormControl, InputLabel,
  Select, MenuItem, Pagination, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, Visibility as ViewIcon,
  Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon,
  CalendarMonth as CalendarIcon, LocationOn as LocationIcon,
  Category as CategoryIcon, Search as SearchIcon,
  Clear as ClearIcon, Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { moderatorService } from '../../services/moderatorService';
import { opportunityService } from '../../services/opportunityService';

const CharityOpportunities = () => {
  const { charityId } = useParams();
  const navigate = useNavigate();

  // State for charity details
  const [charity, setCharity] = useState(null);
  const [loadingCharity, setLoadingCharity] = useState(true);

  // State for opportunities
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (charityId) {
      fetchCharityDetails();
      fetchOpportunities();
    }
  }, [charityId]);

  useEffect(() => {
    if (charityId) {
      fetchOpportunities();
    }
  }, [page, searchQuery, statusFilter, categoryFilter]);

  const fetchCharityDetails = async () => {
    try {
      setLoadingCharity(true);
      const response = await moderatorService.getCharityDetails(charityId);
      setCharity(response.data.charity);
    } catch (error) {
      toast.error('Failed to load charity details');
      console.error('Error:', error);
    } finally {
      setLoadingCharity(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        charityId
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;

      const response = await moderatorService.getCharityOpportunities(charityId, params);
      
      if (response?.data) {
        setOpportunities(response.data);
        setTotal(response.total || response.count || 0);
      } else {
        setOpportunities(response || []);
        setTotal((response && response.length) || 0);
      }
    } catch (error) {
      toast.error('Failed to load opportunities');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPage(1);
    setTimeout(() => {
      fetchOpportunities();
    }, 100);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      setPage(1);
      fetchOpportunities();
    }
  };

  // Handle view details for an opportunity (opens dialog and loads data)
  const handleViewDetails = async (opportunityId) => {
    try {
      setDetailsLoading(true);
      setDetailsOpen(true);

      const response = await opportunityService.getOpportunity(opportunityId);

      // Support both direct object and { data: ... } responses
      const data = response?.data || response;
      setSelectedOpportunity(data);
    } catch (error) {
      toast.error('Failed to load opportunity details');
      console.error('Error fetching opportunity details:', error);
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Applications dialog state
    const [applicationsOpen, setApplicationsOpen] = useState(false);
    const [selectedOpportunityForApps, setSelectedOpportunityForApps] = useState(null);
    const [applications, setApplications] = useState([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);

    const openDeleteDialog = (id) => {
      setDeletingId(id);
      setDeleteDialogOpen(true);
    };

    // Confirmed delete (calls API)
    const handleDeleteOpportunity = async () => {
      if (!deletingId) return;
      try {
        setDeleteLoading(true);
        await opportunityService.deleteOpportunity(deletingId);
        toast.success('Opportunity deleted');
        setDeleteDialogOpen(false);
        setDeletingId(null);
        // Refresh list
        fetchOpportunities();
      } catch (error) {
        toast.error('Failed to delete opportunity');
        console.error('Error deleting opportunity:', error);
      } finally {
        setDeleteLoading(false);
      }
    };

    // Handle view applications for an opportunity
    const handleViewApplications = async (opportunity) => {
      try {
        setApplicationsLoading(true);
        setSelectedOpportunityForApps(opportunity);
        setApplicationsOpen(true);

        const response = await opportunityService.getOpportunityApplications(opportunity.id);
        const data = response?.data || response;
        setApplications(data || []);
      } catch (error) {
        toast.error('Failed to load applications');
        console.error('Error fetching applications:', error);
        setApplicationsOpen(false);
      } finally {
        setApplicationsLoading(false);
      }
    };

  const StatusBadge = ({ status }) => {
    const statusMap = {
      draft: { label: 'Draft', color: 'default' },
      published: { label: 'Published', color: 'success' },
      active: { label: 'Active', color: 'info' },
      completed: { label: 'Completed', color: 'primary' },
      cancelled: { label: 'Cancelled', color: 'error' },
      paused: { label: 'Paused', color: 'warning' }
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

  if (loadingCharity) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!charity) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Charity not found or you don't have permission to view this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/moderator/management')}
          sx={{ mb: 2 }}
        >
          Back to Moderator Management
        </Button>
        
        <Typography variant="h4" gutterBottom>
          Charity 
        </Typography>
      </Box>

      {/* Charity Information Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Charity Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Organization Name
                  </Typography>
                  <Typography variant="h6">
                    {charity.organizationName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Registration Number
                  </Typography>
                  <Typography variant="body1">
                    {charity.registrationNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contact Email
                  </Typography>
                  <Typography variant="body1">
                    {charity.user?.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contact Person
                  </Typography>
                  <Typography variant="body1">
                    {charity.user?.firstName} {charity.user?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {charity.description || 'No description provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Areas of Focus
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {charity.areasOfFocus?.map((area, index) => (
                      <Chip key={index} label={area} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Verification Status
                </Typography>
                <StatusBadge status={charity.verificationStatus} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }} gutterBottom>
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {format(new Date(charity.createdAt), 'PPP')}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }} gutterBottom>
                  Total Rating
                </Typography>
                <Typography variant="h6">
                  {charity.rating || 0}/5
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Opportunities Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Opportunities ({total})
        </Typography>

        {/* Search and Filter Controls */}
        <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField 
                size="small" 
                fullWidth
                label="Search Opportunities" 
                placeholder="Search by title, description..."
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select 
                  value={statusFilter} 
                  label="Status" 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Category</InputLabel>
                <Select 
                  value={categoryFilter} 
                  label="Category" 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="Education">Education</MenuItem>
                  <MenuItem value="Healthcare">Healthcare</MenuItem>
                  <MenuItem value="Environment">Environment</MenuItem>
                  <MenuItem value="Animal Welfare">Animal Welfare</MenuItem>
                  <MenuItem value="Community Development">Community Development</MenuItem>
                  <MenuItem value="Arts & Culture">Arts & Culture</MenuItem>
                  <MenuItem value="Sports & Recreation">Sports & Recreation</MenuItem>
                  <MenuItem value="Elderly Care">Elderly Care</MenuItem>
                  <MenuItem value="Youth Development">Youth Development</MenuItem>
                  <MenuItem value="Homelessness">Homelessness</MenuItem>
                  <MenuItem value="Disaster Relief">Disaster Relief</MenuItem>
                  <MenuItem value="Human Rights">Human Rights</MenuItem>
                  <MenuItem value="Mental Health">Mental Health</MenuItem>
                  <MenuItem value="Food Security">Food Security</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Stack direction="column" spacing={1}>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  disabled={loading}
                >
                  Clear
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchOpportunities}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Results Summary */}
          {!loading && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                {total === 0 ? 'No opportunities found' : 
                 `Showing ${((page - 1) * pageSize) + 1}-${Math.min(page * pageSize, total)} of ${total} opportunities`}
                {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && 
                 ` (filtered${searchQuery ? ` by "${searchQuery}"` : ''}${statusFilter !== 'all' ? ` - ${statusFilter}` : ''}${categoryFilter !== 'all' ? ` - ${categoryFilter}` : ''})`}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Opportunities Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Volunteers</TableCell>
                  {/* <TableCell>Start Date</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Created</TableCell> */}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {opportunities.map((opportunity) => (
                  <TableRow key={opportunity.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {opportunity.title}
                      </Typography>
                      {opportunity.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {opportunity.description.substring(0, 50)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={opportunity.category || 'N/A'} 
                        size="small" 
                        variant="filled" 
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={opportunity.status} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {opportunity.volunteersConfirmed || 0}/{opportunity.numberOfVolunteers || 0}
                        </Typography>
                      </Box>
                    </TableCell>
                    {/* <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {opportunity.startDate ? format(new Date(opportunity.startDate), 'MMM dd, yyyy') : 'TBD'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {opportunity.locationType || 'Remote'}
                        </Typography>
                      </Box>
                    </TableCell>
                      <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {opportunity.views || '0'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(opportunity.createdAt), 'MMM dd, yyyy')}
                    </TableCell> */}
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          size="small"
                            color="primary"
                            title="View Details"
                            onClick={() => handleViewDetails(opportunity.id)}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          title="View Applications"
                          onClick={() => handleViewApplications(opportunity)}
                        >
                          <PeopleIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          title="Delete Opportunity"
                          onClick={() => openDeleteDialog(opportunity.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {opportunities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                        {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                          ? 'No opportunities found matching your filters.'
                          : 'This charity has not created any opportunities yet.'
                        }
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={Math.max(1, Math.ceil(total / pageSize))} 
              page={page} 
              onChange={(e, p) => setPage(p)} 
              color="primary" 
            />
          </Box>
        )}
        {/* Opportunity Details Dialog */}
        <Dialog open={detailsOpen} onClose={() => { setDetailsOpen(false); setSelectedOpportunity(null); }} maxWidth="sm" fullWidth>
          <DialogTitle>Opportunity Details</DialogTitle>
          <DialogContent dividers>
            {detailsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : selectedOpportunity ? (
              <Box>
                <Typography variant="h6" gutterBottom>{selectedOpportunity.title}</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedOpportunity.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2"><strong>Category:</strong> {selectedOpportunity.category || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Status:</strong> {selectedOpportunity.status}</Typography>
                <Typography variant="body2"><strong>Start Date:</strong> {selectedOpportunity.startDate ? format(new Date(selectedOpportunity.startDate), 'PPP') : 'TBD'}</Typography>
                <Typography variant="body2"><strong>Location:</strong> {selectedOpportunity.locationType || 'Remote'}</Typography>
                <Typography variant="body2"><strong>Volunteers:</strong> {selectedOpportunity.volunteersConfirmed || 0}/{selectedOpportunity.numberOfVolunteers || 0}</Typography>
                <Typography variant="body2"><strong>Created:</strong> {selectedOpportunity.createdAt ? format(new Date(selectedOpportunity.createdAt), 'PPP') : ''}</Typography>
                  <Typography variant="body2"><strong>Views:</strong> {selectedOpportunity.views || 0}</Typography>
              </Box>
            ) : (
              <Typography>No details available.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setDetailsOpen(false); setSelectedOpportunity(null); }}>Close</Button>
          </DialogActions>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => { setDeleteDialogOpen(false); setDeletingId(null); }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete Opportunity</DialogTitle>
          <DialogContent dividers>
            <Typography>
              Are you sure you want to delete this opportunity? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setDeleteDialogOpen(false); setDeletingId(null); }} disabled={deleteLoading}>Cancel</Button>
            <Button color="error" onClick={handleDeleteOpportunity} disabled={deleteLoading}>
              {deleteLoading ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Applications Dialog */}
        <Dialog
          open={applicationsOpen}
          onClose={() => { setApplicationsOpen(false); setSelectedOpportunityForApps(null); setApplications([]); }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Applications for: {selectedOpportunityForApps?.title || 'Opportunity'}
          </DialogTitle>
          <DialogContent dividers>
            {applicationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : applications.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Volunteer</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Applied</TableCell>
                      <TableCell>Hours</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          {application.volunteer?.user?.firstName || application.User?.firstName || 'N/A'} {application.volunteer?.user?.lastName || application.User?.lastName || ''}
                        </TableCell>
                        <TableCell>
                          {application.volunteer?.user?.email || application.User?.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={application.status} 
                            size="small" 
                            color={application.status === 'accepted' ? 'success' : application.status === 'rejected' ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(application.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {application.hoursCommitted || 0} / {application.hoursWorked || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No applications received for this opportunity yet.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setApplicationsOpen(false); setSelectedOpportunityForApps(null); setApplications([]); }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default CharityOpportunities;