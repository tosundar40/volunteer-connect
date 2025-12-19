import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardContent, CardActions,
  Button, TextField, Box, Chip, Pagination, InputLabel, FormControl,
  Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Alert, Divider, Skeleton,
  CardMedia, Stack, FormHelperText, Paper, OutlinedInput, Tooltip,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Search as SearchIcon, FilterList as FilterIcon,
  LocationOn as LocationIcon, CalendarToday as DateIcon,
  People as PeopleIcon, Schedule as TimeIcon,
  Work as WorkIcon, Clear as ClearIcon, VolunteerActivism as ApplyIcon,
  ExpandMore as ExpandMoreIcon, TrendingUp as TrendingIcon
  , Visibility as VisibilityIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { opportunityService } from '../../services/opportunityService';
import { applicationService } from '../../services/applicationService';
import volunteerService from '../../services/volunteerService';

const interestCategories = [
  'Education', 'Healthcare', 'Environment', 'Animal Welfare',
  'Community Development', 'Arts & Culture', 'Sports & Recreation',
  'Elderly Care', 'Youth Development', 'Homelessness', 'Disaster Relief',
  'Human Rights', 'Mental Health', 'Food Security', 'Technology', 'Other'
];

const commonSkills = [
  'Teaching', 'Mentoring', 'Tutoring', 'Data Analysis', 'Web Development',
  'Writing', 'Event Planning', 'Marketing', 'Translation', 'Photography',
  'Graphic Design', 'Fundraising', 'Community Outreach', 'Leadership', 'Problem Solving'
];

const OpportunityList = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 12
  });

  // Search and filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    locationType: '',
    city: '',
    startDate: null,
    skills: [],
    dateRange: '' // today, week, month, custom
  });
  const [showFilters, setShowFilters] = useState(false);
  const [applying, setApplying] = useState(null);
  const [applicationDialog, setApplicationDialog] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [appliedOpportunityIds, setAppliedOpportunityIds] = useState(new Set());
  const [approvalStatus, setApprovalStatus] = useState(null);

  // Fetch opportunities
  const fetchOpportunities = async (page = 1, appliedFilters = filters) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        search: appliedFilters.search,
        category: appliedFilters.category,
        locationType: appliedFilters.locationType,
        city: appliedFilters.city,
        skills: appliedFilters.skills?.length > 0 ? appliedFilters.skills[0] : ''
      };
      
      // Format date for API
      if (appliedFilters.startDate) {
        params.startDate = format(appliedFilters.startDate, 'yyyy-MM-dd');
      }

      const response = await opportunityService.getOpportunities(params);
      setOpportunities(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load opportunities');
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchOpportunities(1, filters);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      locationType: '',
      city: '',
      startDate: null,
      skills: [],
      dateRange: ''
    };
    setFilters(clearedFilters);
    fetchOpportunities(1, clearedFilters);
  };

  // Handle date range shortcuts
  const handleDateRange = (range) => {
    let newDate = null;
    const today = new Date();

    if (range === 'today') {
      newDate = today;
    } else if (range === 'week') {
      newDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'month') {
      newDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    setFilters(prev => ({
      ...prev,
      startDate: newDate,
      dateRange: range
    }));
  };

  // Handle pagination
  const handlePageChange = (event, value) => {
    fetchOpportunities(value);
  };

  // Handle application
  const handleApply = async (opportunity) => {
    if (!isAuthenticated) {
      toast.info('Please log in to apply for opportunities');
      navigate('/login');
      return;
    }

    if (user?.role !== 'volunteer') {
      toast.error('Only volunteers can apply for opportunities');
      return;
    }

    if (approvalStatus === 'pending') {
      toast.info('Your account approval is pending with a moderator — you cannot apply yet.');
      return;
    }

    setSelectedOpportunity(opportunity);
    setApplicationDialog(true);
  };

  // Submit application
  const submitApplication = async () => {
    try {
      setApplying(selectedOpportunity.id);
      await applicationService.createApplication({
        opportunityId: selectedOpportunity.id,
        applicationMessage: applicationMessage.trim() || 'I am interested in this opportunity.'
      });
      
      toast.success('Application submitted successfully!');
      setApplicationDialog(false);
      setApplicationMessage('');
      setSelectedOpportunity(null);
      
      // Refresh opportunities to update application counts
      fetchOpportunities(pagination.currentPage);
      // mark this opportunity as applied for the current user
      try {
        const newSet = new Set(appliedOpportunityIds);
        newSet.add(selectedOpportunity.id);
        setAppliedOpportunityIds(newSet);
      } catch (e) {}
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setApplying(null);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Load current volunteer's applications to identify already-applied opportunities
  useEffect(() => {
    const loadMyApplications = async () => {
      if (!isAuthenticated || user?.role !== 'volunteer') return;
      try {
        const res = await applicationService.getMyApplications();
        const apps = Array.isArray(res) ? res : (res.data || res);
        const ids = new Set();
        (apps || []).forEach(app => {
          const oppId = app.opportunityId || app.opportunity?.id;
          if (oppId) ids.add(oppId);
        });
        setAppliedOpportunityIds(ids);
      } catch (err) {
        console.error('Failed to load my applications:', err);
      }
    };

    loadMyApplications();
    // also fetch volunteer profile to get approvalStatus
    const fetchMyProfile = async () => {
      if (!isAuthenticated || user?.role !== 'volunteer') return;
      try {
        const res = await volunteerService.getMyProfile();
        setApprovalStatus(res.data.approvalStatus || null);
      } catch (err) {
        console.error('Failed to fetch volunteer profile:', err);
      }
    };

    fetchMyProfile();
  }, [isAuthenticated, user]);

  // Opportunity card component
  const OpportunityCard = ({ opportunity }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', '&:hover': { boxShadow: 4, transform: 'translateY(-4px)' } }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
            {opportunity.title}
          </Typography>
          {opportunity.volunteersConfirmed >= opportunity.numberOfVolunteers && (
            <Tooltip title="This opportunity is full">
              <Chip label="Full" size="small" color="default" variant="outlined" />
            </Tooltip>
          )}
        </Box>

        {/* Charity Name */}
        {opportunity.charity?.user && (
          <Typography variant="body2" color="primary" sx={{ mb: 1, fontWeight: 500 }}>
            {opportunity.charity.user.firstName} {opportunity.charity.user.lastName}
          </Typography>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {opportunity.description?.length > 150 
            ? `${opportunity.description.substring(0, 150)}...` 
            : opportunity.description}
        </Typography>

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {opportunity.locationType === 'virtual' ? '💻 Virtual' : `📍 ${opportunity.city}, ${opportunity.state}`}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DateIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {format(new Date(opportunity.startDate), 'MMM dd, yyyy')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {opportunity.volunteersConfirmed}/{opportunity.numberOfVolunteers} volunteers
            </Typography>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ height: 4, bgcolor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ height: '100%', bgcolor: 'primary.main', width: `${(opportunity.volunteersConfirmed / opportunity.numberOfVolunteers) * 100}%` }} />
              </Box>
            </Box>
          </Box>

          {/* Views count */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <VisibilityIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {typeof opportunity.views === 'number' ? opportunity.views : 0} views
            </Typography>
          </Box>
        </Stack>

        {/* Category Badge */}
        {opportunity.category && (
          <Box sx={{ mb: 1 }}>
            <Chip 
              label={opportunity.category} 
              size="small" 
              color="primary" 
              variant="filled"
              icon={<TrendingIcon />}
            />
          </Box>
        )}
        
        {/* Required Skills Display */}
        {opportunity.requiredSkills?.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
              Required Skills:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {opportunity.requiredSkills.slice(0, 4).map((skill, idx) => (
                <Chip 
                  key={idx}
                  label={skill} 
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {opportunity.requiredSkills.length > 4 && (
                <Chip 
                  label={`+${opportunity.requiredSkills.length - 4} more`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Button 
          size="small" 
          component={Link} 
          to={`/opportunities/${opportunity.id}`}
          variant="outlined"
        >
          View Details
        </Button>
        
        {isAuthenticated && user?.role === 'volunteer' && (
          <Tooltip title={
            appliedOpportunityIds.has(opportunity.id) ? 'You have already applied for this one' :
            (approvalStatus === 'pending' ? 'Account approval pending — cannot apply' : '')
          }>
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={<ApplyIcon />}
                onClick={() => handleApply(opportunity)}
                disabled={
                  applying === opportunity.id ||
                  opportunity.volunteersConfirmed >= opportunity.numberOfVolunteers ||
                  appliedOpportunityIds.has(opportunity.id) ||
                  approvalStatus === 'pending'
                }
              >
                {appliedOpportunityIds.has(opportunity.id) ? 'Applied' : (applying === opportunity.id ? 'Applying...' : (approvalStatus === 'pending' ? 'Pending Approval' : 'Apply'))}
              </Button>
            </span>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="80%" />
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" width={80} height={24} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Browse Opportunities
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Discover meaningful volunteer opportunities that match your interests and skills.
        </Typography>

        {/* Search and Filter Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search Bar */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search opportunities by title or description..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            
            {/* Action Buttons */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<FilterIcon />}
                >
                  Filters
                </Button>
                {(filters.search || filters.category || filters.locationType || filters.city || filters.startDate || filters.skills?.length > 0) && (
                  <Button
                    variant="text"
                    onClick={clearFilters}
                    startIcon={<ClearIcon />}
                  >
                    Clear All
                  </Button>
                )}
              </Box>
            </Grid>

            {/* Extended Filters */}
            {showFilters && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                {/* Primary Filters Row */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Cause / Category</InputLabel>
                    <Select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      label="Cause / Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {interestCategories.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Location Type</InputLabel>
                    <Select
                      value={filters.locationType}
                      onChange={(e) => setFilters(prev => ({ ...prev, locationType: e.target.value }))}
                      label="Location Type"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="in-person">🏢 In-Person</MenuItem>
                      <MenuItem value="virtual">💻 Virtual</MenuItem>
                      <MenuItem value="hybrid">🌐 Hybrid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="City"
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city name"
                    InputProps={{
                      startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>

                {/* Date Filters with Shortcuts */}
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Start Date</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap' }}>
                    {['today', 'week', 'month'].map((range) => (
                      <Button
                        key={range}
                        size="small"
                        variant={filters.dateRange === range ? 'contained' : 'outlined'}
                        onClick={() => handleDateRange(range)}
                        sx={{ 
                          textTransform: 'capitalize',
                          fontSize: '0.75rem',
                          px: 1,
                          py: 0.5
                        }}
                      >
                        {range}
                      </Button>
                    ))}
                  </Stack>
                  <DatePicker
                    label="Custom Date"
                    value={filters.startDate}
                    onChange={(newValue) => setFilters(prev => ({ ...prev, startDate: newValue, dateRange: 'custom' }))}
                    renderInput={(params) => <TextField fullWidth {...params} size="small" />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* Skills Filter */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon fontSize="small" /> Required Skills (Optional)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Select skills you have or want to develop:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {commonSkills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        onClick={() => {
                          setFilters(prev => {
                            const newSkills = prev.skills.includes(skill)
                              ? prev.skills.filter(s => s !== skill)
                              : [...prev.skills, skill];
                            return { ...prev, skills: newSkills };
                          });
                        }}
                        variant={filters.skills.includes(skill) ? 'filled' : 'outlined'}
                        color={filters.skills.includes(skill) ? 'primary' : 'default'}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                  {filters.skills.length > 0 && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="caption">
                        Selected: {filters.skills.join(', ')}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        {/* Results Summary */}
        {!loading && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {pagination.totalCount} opportunities found
              {filters.search && ` for "${filters.search}"`}
            </Typography>
          </Box>
        )}

        {/* Opportunities Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : opportunities.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {opportunities.map((opportunity) => (
                <Grid item xs={12} sm={6} md={4} key={opportunity.id}>
                  <OpportunityCard opportunity={opportunity} />
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No opportunities found matching your criteria. Try adjusting your search filters.
          </Alert>
        )}

        {/* Application Dialog */}
        <Dialog 
          open={applicationDialog} 
          onClose={() => setApplicationDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Apply for: {selectedOpportunity?.title}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tell the charity why you're interested in this opportunity and what you can contribute.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="I am excited about this opportunity because..."
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApplicationDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitApplication}
              variant="contained"
              disabled={applying}
              startIcon={applying && <CircularProgress size={16} />}
            >
              {applying ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default OpportunityList;
