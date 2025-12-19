import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Box,
  Typography,
  Stack,
  Alert,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  School as EducationIcon,
  Work as ExperienceIcon,
  ContactPhone as ContactIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const RequestAdditionalInfoDialog = ({ 
  open, 
  onClose, 
  volunteer, 
  application, 
  onSubmit 
}) => {
  const [requestType, setRequestType] = useState('');
  const [message, setMessage] = useState('');
  const [specificRequests, setSpecificRequests] = useState([]);
  const [customRequests, setCustomRequests] = useState(['']);
  const [urgency, setUrgency] = useState('normal');
  const [deadline, setDeadline] = useState('');

  const predefinedRequests = [
    { id: 'background_check', label: 'Background Check Results', icon: <SecurityIcon /> },
    { id: 'references', label: 'Professional References', icon: <ContactIcon /> },
    { id: 'certifications', label: 'Relevant Certifications', icon: <EducationIcon /> },
    { id: 'resume', label: 'Updated Resume/CV', icon: <DocumentIcon /> },
    { id: 'work_samples', label: 'Work Samples/Portfolio', icon: <AssignmentIcon /> },
    { id: 'availability_details', label: 'Detailed Availability Schedule', icon: <AssignmentIcon /> },
    { id: 'emergency_contact', label: 'Emergency Contact Information', icon: <ContactIcon /> },
    { id: 'identification', label: 'Photo Identification', icon: <SecurityIcon /> },
    { id: 'health_clearance', label: 'Health/Medical Clearance', icon: <DocumentIcon /> },
    { id: 'volunteer_experience', label: 'Previous Volunteer Experience Details', icon: <ExperienceIcon /> }
  ];

  const handleSpecificRequestToggle = (requestId) => {
    setSpecificRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleCustomRequestChange = (index, value) => {
    setCustomRequests(prev => {
      const newRequests = [...prev];
      newRequests[index] = value;
      return newRequests;
    });
  };

  const addCustomRequest = () => {
    setCustomRequests(prev => [...prev, '']);
  };

  const removeCustomRequest = (index) => {
    setCustomRequests(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!requestType && specificRequests.length === 0 && customRequests.filter(req => req.trim()).length === 0) {
      toast.error('Please specify what information you need');
      return;
    }

    if (!message.trim()) {
      toast.error('Please provide a message explaining why this information is needed');
      return;
    }

    const requestData = {
      applicationId: application.id,
      volunteerId: volunteer.id,
      requestType,
      message: message.trim(),
      specificRequests,
      customRequests: customRequests.filter(req => req.trim()),
      urgency,
      deadline: deadline || null
    };

    onSubmit(requestData);
  };

  const generateDefaultMessage = () => {
    const selectedLabels = specificRequests.map(id => 
      predefinedRequests.find(req => req.id === id)?.label
    ).filter(Boolean);
    
    const customItems = customRequests.filter(req => req.trim());
    const allItems = [...selectedLabels, ...customItems];
    
    if (allItems.length === 0) return '';
    
    return `Dear ${volunteer.user?.firstName},

Thank you for your interest in volunteering with our organization. To proceed with your application for "${application.opportunity?.title}", we need some additional information from you:

${allItems.map(item => `• ${item}`).join('\n')}

This information helps us ensure we can provide the best volunteer experience and match you with opportunities that align with your background and skills.

Please provide this information at your earliest convenience. If you have any questions, feel free to contact us.

Thank you for your understanding.

Best regards,
${application.opportunity?.charity?.organizationName || 'Our Team'}`;
  };

  const useDefaultMessage = () => {
    setMessage(generateDefaultMessage());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AssignmentIcon />
          Request Additional Information
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Request specific information from {volunteer?.user?.firstName} {volunteer?.user?.lastName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Request Type */}
          <FormControl fullWidth>
            <InputLabel>Request Category</InputLabel>
            <Select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              label="Request Category"
            >
              <MenuItem value="documents">Document Verification</MenuItem>
              <MenuItem value="experience">Experience Clarification</MenuItem>
              <MenuItem value="availability">Availability Confirmation</MenuItem>
              <MenuItem value="skills">Skills Assessment</MenuItem>
              <MenuItem value="background">Background Verification</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Predefined Requests */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Common Information Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select any standard information you need:
            </Typography>
            
            <FormGroup>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                gap: 1 
              }}>
                {predefinedRequests.map((request) => (
                  <FormControlLabel
                    key={request.id}
                    control={
                      <Checkbox
                        checked={specificRequests.includes(request.id)}
                        onChange={() => handleSpecificRequestToggle(request.id)}
                        size="small"
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        {request.icon}
                        <Typography variant="body2">{request.label}</Typography>
                      </Box>
                    }
                  />
                ))}
              </Box>
            </FormGroup>
          </Box>

          {/* Custom Requests */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Custom Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add any specific information not listed above:
            </Typography>
            
            <Stack spacing={2}>
              {customRequests.map((request, index) => (
                <Box key={index} display="flex" alignItems="center" gap={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter custom request..."
                    value={request}
                    onChange={(e) => handleCustomRequestChange(index, e.target.value)}
                  />
                  {customRequests.length > 1 && (
                    <IconButton 
                      size="small" 
                      onClick={() => removeCustomRequest(index)}
                      color="error"
                    >
                      <RemoveIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={addCustomRequest}
                variant="outlined"
                size="small"
                sx={{ alignSelf: 'flex-start' }}
              >
                Add Another Request
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* Preview Selected Requests */}
          {(specificRequests.length > 0 || customRequests.some(req => req.trim())) && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Information Being Requested
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {specificRequests.map(id => {
                  const request = predefinedRequests.find(req => req.id === id);
                  return (
                    <Chip 
                      key={id} 
                      label={request?.label} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  );
                })}
                {customRequests.filter(req => req.trim()).map((request, index) => (
                  <Chip 
                    key={`custom-${index}`} 
                    label={request} 
                    size="small" 
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Urgency and Deadline */}
          <Box display="flex" gap={2}>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Urgency</InputLabel>
              <Select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                label="Urgency"
              >
                <MenuItem value="low">Low - No rush</MenuItem>
                <MenuItem value="normal">Normal - Within a week</MenuItem>
                <MenuItem value="high">High - ASAP</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              sx={{ flex: 1 }}
              type="date"
              label="Deadline (Optional)"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Message */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Message to Volunteer
              </Typography>
              <Button 
                size="small" 
                onClick={useDefaultMessage}
                disabled={specificRequests.length === 0 && !customRequests.some(req => req.trim())}
              >
                Generate Default Message
              </Button>
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={8}
              placeholder="Explain why you need this information and provide any specific instructions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              helperText="Be clear and professional. Explain how this helps with the volunteer matching process."
            />
          </Box>

          {urgency === 'high' && (
            <Alert severity="warning">
              High urgency requests will be flagged as priority for the volunteer. 
              Use this only when truly necessary.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={!message.trim()}
        >
          Send Request
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestAdditionalInfoDialog;