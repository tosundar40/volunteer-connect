import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Box,
  FormHelperText,
  FormControlLabel,
  Switch,
  CircularProgress,
  Divider
  ,Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';

const categories = [
  'Education', 'Healthcare', 'Environment', 'Animal Welfare',
  'Community Development', 'Arts & Culture', 'Sports & Recreation',
  'Elderly Care', 'Youth Development', 'Homelessness', 'Disaster Relief',
  'Human Rights', 'Mental Health', 'Food Security', 'Other'
];

const skillOptions = [
  'Teaching', 'Counseling', 'First Aid', 'Event Planning', 'Fundraising',
  'Marketing', 'Social Media', 'Photography', 'Video Editing', 'Graphic Design',
  'Web Development', 'Data Entry', 'Administration', 'Customer Service',
  'Public Speaking', 'Translation', 'Cooking', 'Driving', 'Manual Labor',
  'Childcare', 'Elderly Care', 'Animal Care', 'Gardening', 'Construction', 'Other'
];

const validationSchema = yup.object({
  title: yup.string().required('Title is required').min(10, 'Title must be at least 10 characters'),
  description: yup.string().required('Description is required').min(50, 'Description must be at least 50 characters'),
  category: yup.string().required('Category is required'),
  numberOfVolunteers: yup.number().required('Number of volunteers is required').min(1).max(1000),
  requiredSkills: yup.array().min(1, 'Select at least one skill'),
  locationType: yup.string().required('Location type is required'),
  startDate: yup.date().required('Start date is required').min(new Date(), 'Start date must be in the future'),
  endDate: yup.date().required('End date is required').min(yup.ref('startDate'), 'End date must be after start date'),
  duration: yup.number().required('Duration is required').min(1, 'Duration must be at least 1 hour'),
  applicationDeadline: yup.date().required('Application deadline is required').max(yup.ref('startDate'), 'Deadline must be before start date'),
});

const CreateOpportunity = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [charityData, setCharityData] = useState(null);

  const formik = useFormik({
    initialValues: {
      title: '', description: '', category: '', requiredSkills: [],
      numberOfVolunteers: 1, locationType: 'in-person', address: '',
      city: '', state: '', postalCode: '', country: '', virtualMeetingLink: '',
      startDate: null, endDate: null, duration: '', applicationDeadline: null,
      backgroundCheckRequired: false, trainingRequired: false,
      trainingDetails: '', physicalRequirements: '', contactPerson: '',
      contactEmail: '', contactPhone: '', status: 'published'
    },
    validationSchema,
     onSubmit: async (values, { setSubmitting }) => {
      // Prevent creating opportunities while charity is under review
      if (charityData?.verificationStatus === 'pending') {
        toast.error('Your charity profile is under review. You cannot make changes until approval is complete.');
        return;
      }
      console.log('🚀 Form submission started!');
      console.log('📝 Form values:', values);
      console.log('❌ Form errors:', formik.errors);
      setLoading(true);
      try {
        const formattedData = {
          ...values,
          startDate: values.startDate?.toISOString(),
          endDate: values.endDate?.toISOString(),
          applicationDeadline: values.applicationDeadline?.toISOString(),
        };
        await api.post('/opportunities', formattedData);
        toast.success('Opportunity created successfully!');
        navigate('/charity/opportunities');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to create opportunity');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/charity/profile');
        setCharityData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch charity profile', err);
      }
    };
    fetchProfile();
  }, []);

   const handleSubmitClick = (e) => {
    console.log('🔄 Submit button clicked!');
    console.log('📋 Form valid?', formik.isValid);
    console.log('❌ Form errors:', formik.errors);
    console.log('✏️ Form touched:', formik.touched);
    
    // Show validation errors as toast if form is invalid
    if (!formik.isValid && Object.keys(formik.errors).length > 0) {
      const errorMessages = Object.values(formik.errors).join(', ');
      toast.error(`Please fix these errors: ${errorMessages}`);
    }
    
    // Don't prevent default - let Formik handle it
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>Create Volunteering Opportunity</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Fill in the details below to post a new volunteering opportunity
          </Typography>

          {charityData?.verificationStatus === 'pending' && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Your charity profile is under review. You cannot make changes until approval is complete.
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Basic Information</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField fullWidth id="title" name="title" label="Opportunity Title"
                  placeholder="e.g., Community Garden Volunteer"
                  value={formik.values.title} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.title && Boolean(formik.errors.title)}
                  helperText={formik.touched.title && formik.errors.title} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={5} id="description" name="description"
                  label="Detailed Description and Objectives"
                  placeholder="Describe the opportunity, what volunteers will do, and the impact..."
                  value={formik.values.description} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={formik.touched.category && Boolean(formik.errors.category)}>
                  <InputLabel>Category</InputLabel>
                  <Select id="category" name="category" value={formik.values.category}
                    onChange={formik.handleChange} onBlur={formik.handleBlur} label="Category">
                    {categories.map((cat) => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                  </Select>
                  {formik.touched.category && formik.errors.category && (
                    <FormHelperText>{formik.errors.category}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" id="numberOfVolunteers" name="numberOfVolunteers"
                  label="Number of Volunteers Required" value={formik.values.numberOfVolunteers}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.numberOfVolunteers && Boolean(formik.errors.numberOfVolunteers)}
                  helperText={formik.touched.numberOfVolunteers && formik.errors.numberOfVolunteers}
                  inputProps={{ min: 1 }} />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Skills and Requirements</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth error={formik.touched.requiredSkills && Boolean(formik.errors.requiredSkills)}>
                  <InputLabel>Required Skills</InputLabel>
                  <Select multiple id="requiredSkills" name="requiredSkills"
                    value={formik.values.requiredSkills} onChange={formik.handleChange} onBlur={formik.handleBlur}
                    input={<OutlinedInput label="Required Skills" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                      </Box>
                    )}>
                    {skillOptions.map((skill) => <MenuItem key={skill} value={skill}>{skill}</MenuItem>)}
                  </Select>
                  {formik.touched.requiredSkills && formik.errors.requiredSkills && (
                    <FormHelperText>{formik.errors.requiredSkills}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} id="physicalRequirements" name="physicalRequirements"
                  label="Physical Requirements (Optional)"
                  placeholder="e.g., Ability to stand for long periods, lift 20kg..."
                  value={formik.values.physicalRequirements} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch id="backgroundCheckRequired" name="backgroundCheckRequired"
                  checked={formik.values.backgroundCheckRequired} onChange={formik.handleChange} />}
                  label="Background Check Required" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch id="trainingRequired" name="trainingRequired"
                  checked={formik.values.trainingRequired} onChange={formik.handleChange} />}
                  label="Training Required" />
              </Grid>
              {formik.values.trainingRequired && (
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} id="trainingDetails" name="trainingDetails"
                    label="Training Details" placeholder="Describe the training..."
                    value={formik.values.trainingDetails} onChange={formik.handleChange} />
                </Grid>
              )}
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Location</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Location Type</InputLabel>
                  <Select id="locationType" name="locationType" value={formik.values.locationType}
                    onChange={formik.handleChange} label="Location Type">
                    <MenuItem value="in-person">In-Person</MenuItem>
                    <MenuItem value="virtual">Virtual</MenuItem>
                    <MenuItem value="hybrid">Hybrid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {(formik.values.locationType === 'in-person' || formik.values.locationType === 'hybrid') && (
                <>
                  <Grid item xs={12}><TextField fullWidth id="address" name="address" label="Address"
                    value={formik.values.address} onChange={formik.handleChange} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth id="city" name="city" label="City"
                    value={formik.values.city} onChange={formik.handleChange} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth id="state" name="state" label="State/Province"
                    value={formik.values.state} onChange={formik.handleChange} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth id="postalCode" name="postalCode" label="Postal Code"
                    value={formik.values.postalCode} onChange={formik.handleChange} /></Grid>
                  <Grid item xs={12} sm={6}><TextField fullWidth id="country" name="country" label="Country"
                    value={formik.values.country} onChange={formik.handleChange} /></Grid>
                </>
              )}
              {(formik.values.locationType === 'virtual' || formik.values.locationType === 'hybrid') && (
                <Grid item xs={12}>
                  <TextField fullWidth id="virtualMeetingLink" name="virtualMeetingLink"
                    label="Virtual Meeting Link" placeholder="e.g., Zoom, Teams link"
                    value={formik.values.virtualMeetingLink} onChange={formik.handleChange} />
                </Grid>
              )}
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Date, Time and Duration</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <DateTimePicker label="Start Date & Time" value={formik.values.startDate}
                  onChange={(value) => formik.setFieldValue('startDate', value)}
                  renderInput={(params) => <TextField {...params} fullWidth
                    error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                    helperText={formik.touched.startDate && formik.errors.startDate} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker label="End Date & Time" value={formik.values.endDate}
                  onChange={(value) => formik.setFieldValue('endDate', value)}
                  renderInput={(params) => <TextField {...params} fullWidth
                    error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                    helperText={formik.touched.endDate && formik.errors.endDate} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" id="duration" name="duration"
                  label="Expected Commitment Duration (hours)" value={formik.values.duration}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.duration && Boolean(formik.errors.duration)}
                  helperText={formik.touched.duration && formik.errors.duration} inputProps={{ min: 1 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker label="Application Deadline" value={formik.values.applicationDeadline}
                  onChange={(value) => formik.setFieldValue('applicationDeadline', value)}
                  renderInput={(params) => <TextField {...params} fullWidth
                    error={formik.touched.applicationDeadline && Boolean(formik.errors.applicationDeadline)}
                    helperText={formik.touched.applicationDeadline && formik.errors.applicationDeadline} />} />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Contact Information</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth id="contactPerson" name="contactPerson" label="Contact Person"
                  value={formik.values.contactPerson} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth id="contactEmail" name="contactEmail" label="Contact Email" type="email"
                  value={formik.values.contactEmail} onChange={formik.handleChange} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth id="contactPhone" name="contactPhone" label="Contact Phone"
                  value={formik.values.contactPhone} onChange={formik.handleChange} />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => navigate('/charity/opportunities')} disabled={loading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading || charityData?.verificationStatus === 'pending'}
                onClick={handleSubmitClick}
                startIcon={loading && <CircularProgress size={20} />}
              >
                Create Opportunity
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default CreateOpportunity;
