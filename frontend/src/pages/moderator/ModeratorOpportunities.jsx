import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Box, Paper, Grid, TextField, InputAdornment,
  IconButton, FormControl, InputLabel, Select, MenuItem, Stack, Button,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip,
  Tooltip, CircularProgress, Pagination, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert
} from '@mui/material';
import {
  Search as SearchIcon, Clear as ClearIcon, Refresh as RefreshIcon,
  Visibility as ViewIcon, DeleteForever as DeleteForeverIcon,
  Work as WorkIcon, Edit as EditIcon, Pause as SuspendIcon, 
  PlayArrow as ResumeIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { moderatorService } from '../../services/moderatorService';
import { opportunityService } from '../../services/opportunityService';

const ModeratorOpportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [opportunityQuery, setOpportunityQuery] = useState('');
  const [opportunityStatus, setOpportunityStatus] = useState('all');
  const [opportunityCategory, setOpportunityCategory] = useState('all');
  const [opportunityPage, setOpportunityPage] = useState(1);
  const [opportunityPageSize, setOpportunityPageSize] = useState(12);
  const [opportunityTotal, setOpportunityTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '', numberOfVolunteers: 1 });
  const [editing, setEditing] = useState(false);

  const [suspendDialog, setSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspending, setSuspending] = useState(false);
  const [actionType, setActionType] = useState('suspend'); // 'suspend' or 'resume'

  const fetchOpportunities = async (page = opportunityPage) => {
    try {
      setLoading(true);
      const params = { page, limit: opportunityPageSize };
      if (opportunityQuery) params.search = opportunityQuery;
      if (opportunityStatus && opportunityStatus !== 'all') params.status = opportunityStatus;
      if (opportunityCategory && opportunityCategory !== 'all') params.category = opportunityCategory;

      const response = await moderatorService.getAllOpportunities(params);
      if (response?.data) {
        setOpportunities(response.data);
        setOpportunityTotal(response.total || response.count || 0);
      } else {
        setOpportunities(response || []);
        setOpportunityTotal((response && response.length) || 0);
      }
    } catch (error) {
      toast.error('Failed to load opportunities');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOpportunities(1); }, [opportunityPageSize]);
  useEffect(() => { fetchOpportunities(opportunityPage); }, [opportunityPage, opportunityQuery, opportunityStatus, opportunityCategory]);

  const handleOpportunitySearch = () => { setOpportunityPage(1); fetchOpportunities(1); };
  const handleOpportunityClear = () => {
    setOpportunityQuery(''); setOpportunityStatus('all'); setOpportunityCategory('all'); setOpportunityPage(1);
    setTimeout(() => fetchOpportunities(1), 100);
  };
  const handleOpportunityKeyPress = (e) => { if (e.key === 'Enter') handleOpportunitySearch(); };

  

  const openDeleteDialog = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setDeleteReason('');
    setDeleteDialog(true);
  };

  const openEditDialog = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setEditForm({
      title: opportunity.title || '',
      description: opportunity.description || '',
      category: opportunity.category || '',
      numberOfVolunteers: opportunity.numberOfVolunteers || 1
    });
    setEditDialog(true);
  };

  const openSuspendDialog = (opportunity, action = 'suspend') => {
    setSelectedOpportunity(opportunity);
    setActionType(action);
    setSuspendReason('');
    setSuspendDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedOpportunity) return;
    try {
      setDeleting(true);
      await moderatorService.deleteOpportunityAsModerator(selectedOpportunity.id, deleteReason);
      toast.success('Opportunity deleted');
      setDeleteDialog(false); setSelectedOpportunity(null); setDeleteReason('');
      fetchOpportunities();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete opportunity');
    } finally {
      setDeleting(false);
    }
  };

  const confirmEdit = async () => {
    if (!selectedOpportunity || !editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      setEditing(true);
      await opportunityService.updateOpportunity(selectedOpportunity.id, editForm);
      toast.success('Opportunity updated successfully');
      setEditDialog(false); setSelectedOpportunity(null);
      fetchOpportunities();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update opportunity');
    } finally {
      setEditing(false);
    }
  };

  const confirmSuspendResume = async () => {
    if (!selectedOpportunity) return;
    try {
      setSuspending(true);
      if (actionType === 'suspend') {
        await moderatorService.suspendOpportunity(selectedOpportunity.id, suspendReason);
        toast.success('Opportunity suspended');
      } else {
        await moderatorService.resumeOpportunity(selectedOpportunity.id, suspendReason);
        toast.success('Opportunity resumed');
      }
      setSuspendDialog(false); setSelectedOpportunity(null); setSuspendReason('');
      fetchOpportunities();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${actionType} opportunity`);
    } finally {
      setSuspending(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Opportunities Management
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              label="Search Opportunities"
              placeholder="Search by title, description, charity name..."
              value={opportunityQuery}
              onChange={(e) => setOpportunityQuery(e.target.value)}
              onKeyPress={handleOpportunityKeyPress}
           
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: opportunityQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setOpportunityQuery('')}>
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
              <Select value={opportunityStatus} label="Status" onChange={(e) => setOpportunityStatus(e.target.value)}>
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={opportunityCategory} label="Category" onChange={(e) => setOpportunityCategory(e.target.value)}>
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="Education">Education</MenuItem>
                <MenuItem value="Healthcare">Healthcare</MenuItem>
                <MenuItem value="Environment">Environment</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="column" spacing={1}>
              <Button variant="outlined" size="small" startIcon={<ClearIcon />} onClick={handleOpportunityClear} disabled={loading}>Clear</Button>
              <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => fetchOpportunities(1)} disabled={loading}>Refresh</Button>
            </Stack>
          </Grid>
        </Grid>
        {!loading && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="body2" color="text.secondary">
                  {opportunityTotal === 0 ? 'No opportunities found' : `Showing ${((opportunityPage - 1) * opportunityPageSize) + 1}-${Math.min(opportunityPage * opportunityPageSize, opportunityTotal)} of ${opportunityTotal} opportunities`}
                  {(opportunityQuery || opportunityStatus !== 'all' || opportunityCategory !== 'all') && (
                    <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                      (filtered)
                    </Typography>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                {opportunityTotal > opportunityPageSize && (
                  <Typography variant="body2" color="text.secondary">
                    Page {opportunityPage} of {Math.ceil(opportunityTotal / opportunityPageSize)}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Charity</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Volunteers</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {opportunities.map((opportunity) => (
                <TableRow key={opportunity.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{opportunity.title}</Typography>
                    {opportunity.description && <Typography variant="body2" color="text.secondary">{opportunity.description.substring(0,50)}...</Typography>}
                  </TableCell>
                  <TableCell><Typography variant="body2">{opportunity.charity?.organizationName || 'N/A'}</Typography></TableCell>
                  <TableCell><Chip label={opportunity.category || 'N/A'} size="small" variant="outlined" color="primary" /></TableCell>
                  <TableCell>
                    <Chip 
                      label={opportunity.status} 
                      size="small" 
                      color={opportunity.status === 'suspended' ? 'warning' : opportunity.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell><Typography variant="body2">{opportunity.volunteersConfirmed || 0}/{opportunity.numberOfVolunteers || 0}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{opportunity.createdAt ? format(new Date(opportunity.createdAt),'MMM dd, yyyy') : 'N/A'}</Typography></TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary" component={Link} to={`/opportunities/${opportunity.id}`}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Edit Opportunity">
                        <IconButton size="small" color="info" onClick={() => openEditDialog(opportunity)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {opportunity.status === 'suspended' ? (
                        <Tooltip title="Resume Opportunity">
                          <IconButton size="small" color="success" onClick={() => openSuspendDialog(opportunity, 'resume')}>
                            <ResumeIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Suspend Opportunity">
                          <IconButton size="small" color="warning" onClick={() => openSuspendDialog(opportunity, 'suspend')}>
                            <SuspendIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Delete Opportunity">
                        <IconButton size="small" color="error" onClick={() => openDeleteDialog(opportunity)}>
                          <DeleteForeverIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {opportunities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="text.secondary" sx={{ py: 3 }}>
                      {opportunityQuery || opportunityStatus !== 'all' || opportunityCategory !== 'all' ? 'No opportunities found matching your filters.' : 'No opportunities found in the system.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {opportunityTotal > opportunityPageSize && (
        <Paper sx={{ mt: 3, p: 2 }} variant="outlined">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Total: {opportunityTotal} opportunities | Page {opportunityPage} of {Math.ceil(opportunityTotal / opportunityPageSize)}
                <FormControl size="small" sx={{ ml: 2, minWidth: 80 }}>
                  <Select
                    value={opportunityPageSize}
                    onChange={(e) => {
                      setOpportunityPageSize(e.target.value);
                      setOpportunityPage(1);
                    }}
                    displayEmpty
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  per page
                </Typography>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
              <Pagination 
                count={Math.max(1, Math.ceil(opportunityTotal / opportunityPageSize))} 
                page={opportunityPage} 
                onChange={(e, p) => setOpportunityPage(p)} 
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      

      <Dialog open={editDialog} onClose={()=>setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Opportunity</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={editForm.description}
              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={editForm.category}
                    label="Category"
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <MenuItem value="Education">Education</MenuItem>
                    <MenuItem value="Healthcare">Healthcare</MenuItem>
                    <MenuItem value="Environment">Environment</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Number of Volunteers"
                  type="number"
                  value={editForm.numberOfVolunteers}
                  onChange={(e) => setEditForm(prev => ({ ...prev, numberOfVolunteers: parseInt(e.target.value) || 1 }))}
                  inputProps={{ min: 1 }}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setEditDialog(false)}>Cancel</Button>
          <Button color="primary" variant="contained" onClick={confirmEdit} disabled={editing}>
            {editing ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={suspendDialog} onClose={()=>setSuspendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{actionType === 'suspend' ? 'Suspend Opportunity' : 'Resume Opportunity'}</DialogTitle>
        <DialogContent>
          <Alert severity={actionType === 'suspend' ? 'warning' : 'info'} sx={{ mb: 2 }}>
            {actionType === 'suspend' 
              ? 'This will temporarily suspend the opportunity and prevent new applications.'
              : 'This will resume the opportunity and allow new applications again.'}
          </Alert>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to {actionType} <strong>{selectedOpportunity?.title}</strong>?
          </Typography>
          <TextField
            fullWidth
            label={actionType === 'suspend' ? 'Suspension reason (required)' : 'Resume notes (optional)'}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            multiline
            rows={3}
            required={actionType === 'suspend'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setSuspendDialog(false)}>Cancel</Button>
          <Button
            color={actionType === 'suspend' ? 'warning' : 'success'}
            variant="contained"
            onClick={confirmSuspendResume}
            disabled={suspending || (actionType === 'suspend' && !suspendReason.trim())}
          >
            {suspending ? 'Processing...' : (actionType === 'suspend' ? 'Suspend' : 'Resume')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={()=>setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Delete Opportunity</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>This action will permanently delete the opportunity.</Alert>
          <Typography>Are you sure you want to permanently delete <strong>{selectedOpportunity?.title}</strong>?</Typography>
          <TextField fullWidth label="Deletion reason (optional)" value={deleteReason} onChange={(e)=>setDeleteReason(e.target.value)} multiline rows={3} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Processing...' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default ModeratorOpportunities;
