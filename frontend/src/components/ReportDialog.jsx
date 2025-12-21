import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { createReport } from '../services/reportService';

const REPORT_REASONS = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'false_information', label: 'False Information' },
  { value: 'safety_concern', label: 'Safety Concern' },
  { value: 'other', label: 'Other' }
];

const ReportDialog = ({ open, onClose, entityType, entityId, entityName }) => {
  const [formData, setFormData] = useState({
    reason: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason) {
      setError('Please select a reason for reporting');
      return;
    }

    if (!formData.description || formData.description.trim().length < 20) {
      setError('Please provide a detailed description (at least 20 characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createReport({
        reportedEntityType: entityType,
        reportedEntityId: entityId,
        reason: formData.reason,
        description: formData.description.trim()
      });

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ reason: '', description: '' });
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Report {entityType === 'user' ? 'User' : entityType.charAt(0).toUpperCase() + entityType.slice(1)}
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Report submitted successfully! Our moderators will review it shortly.
            </Alert>
          ) : (
            <>
              {/* Entity Information Box */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2.5, 
                  mb: 3, 
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Reporting {entityType === 'user' ? 'User' : entityType.charAt(0).toUpperCase() + entityType.slice(1)}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {entityName}
                </Typography>
              </Paper>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Reason Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  What's the issue?
                </Typography>
                <TextField
                  select
                  fullWidth
                  label="Select a reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <MenuItem value="">Choose the most appropriate reason</MenuItem>
                  {REPORT_REASONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Description */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Additional details
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Describe what happened"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Please provide detailed information about the issue. Include specific examples if possible..."
                  required
                  disabled={loading}
                  helperText={`${formData.description.length} characters (minimum 20 required)`}
                />
              </Box>

              {/* Warning Notice */}
              <Alert severity="info" sx={{ mt: 3 }} icon={false}>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  <strong>Please note:</strong> False reports may result in action against your account. All reports are carefully reviewed by our moderation team.
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {!success && (
            <Button 
              type="submit"
              variant="contained" 
              color="error"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReportDialog;
