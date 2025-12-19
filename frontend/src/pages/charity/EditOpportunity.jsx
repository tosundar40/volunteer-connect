import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  duration: yup.number().required('Duration is required').min(1, 'Duration must be at least 1 hour'),
});

const EditOpportunity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
      setLoading(true);
      try {
        const formattedData = {
          ...values,
          startDate: values.startDate?.toISOString(),
          endDate: values.endDate?.toISOString(),
          applicationDeadline: values.applicationDeadline?.toISOString(),
        };
        await api.put(`/opportunities/${id}`, formattedData);
        toast.success('Opportunity updated successfully!');
        navigate('/charity/opportunities');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to update opportunity');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const { data } = await api.get(`/opportunities/${id}`);
        const opportunity = data.data;
        
        formik.setValues({
          title: opportunity.title || '',
          description: opportunity.description || '',
          category: opportunity.category || '',
          requiredSkills: opportunity.requiredSkills || [],
          numberOfVolunteers: opportunity.numberOfVolunteers || 1,
          locationType: opportunity.locationType || 'in-person',
          address: opportunity.address || '',
          city: opportunity.city || '',
          state: opportunity.state || '',
          postalCode: opportunity.postalCode || '',
          country: opportunity.country || '',
          virtualMeetingLink: opportunity.virtualMeetingLink || '',
          startDate: opportunity.startDate ? new Date(opportunity.startDate) : null,
          endDate: opportunity.endDate ? new Date(opportunity.endDate) : null,
          duration: opportunity.duration || '',
          applicationDeadline: opportunity.applicationDeadline ? new Date(opportunity.applicationDeadline) : null,
          backgroundCheckRequired: opportunity.backgroundCheckRequired || false,
          trainingRequired: opportunity.trainingRequired || false,
          trainingDetails: opportunity.trainingDetails || '',
          physicalRequirements: opportunity.physicalRequirements || '',
          contactPerson: opportunity.contactPerson || '',
          contactEmail: opportunity.contactEmail || '',
          contactPhone: opportunity.contactPhone || '',
          status: opportunity.status || 'published'
        });
      } catch (error) {
        toast.error('Failed to fetch opportunity details');
        navigate('/charity/opportunities');
      } finally {
        setFetching(false);
      }
    };

    fetchOpportunity();
  }, [id]);

  if (fetching) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>Edit Volunteering Opportunity</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update the details below to modify this volunteering opportunity
          </Typography>

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
                  label="Number of Volunteers Needed" value={formik.values.numberOfVolunteers}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.numberOfVolunteers && Boolean(formik.errors.numberOfVolunteers)}
                  helperText={formik.touched.numberOfVolunteers && formik.errors.numberOfVolunteers}
                  inputProps={{ min: 1, max: 1000 }} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth error={formik.touched.requiredSkills && Boolean(formik.errors.requiredSkills)}>
                  <InputLabel>Required Skills</InputLabel>
                  <Select id="requiredSkills" name="requiredSkills" multiple
                    value={formik.values.requiredSkills} onChange={formik.handleChange}
                    input={<OutlinedInput label="Required Skills" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((skill) => <Chip key={skill} label={skill} size="small" />)}
                      </Box>
                    )}>
                    {skillOptions.map((skill) => (
                      <MenuItem key={skill} value={skill}
                        style={{ fontWeight: formik.values.requiredSkills?.includes(skill) ? 'bold' : 'normal' }}>
                        {skill}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.requiredSkills && formik.errors.requiredSkills && (
                    <FormHelperText>{formik.errors.requiredSkills}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Location Details</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={formik.touched.locationType && Boolean(formik.errors.locationType)}>
                  <InputLabel>Location Type</InputLabel>
                  <Select id="locationType" name="locationType" value={formik.values.locationType}
                    onChange={formik.handleChange} onBlur={formik.handleBlur} label="Location Type">
                    <MenuItem value="in-person">In-Person</MenuItem>
                    <MenuItem value="virtual">Virtual</MenuItem>
                    <MenuItem value="hybrid">Hybrid</MenuItem>
                  </Select>
                  {formik.touched.locationType && formik.errors.locationType && (
                    <FormHelperText>{formik.errors.locationType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              {formik.values.locationType !== 'virtual' && (
                <>
                  <Grid item xs={12}>
                    <TextField fullWidth id="address" name="address" label="Street Address"
                      value={formik.values.address} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth id="city" name="city" label="City"
                      value={formik.values.city} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField fullWidth id="state" name="state" label="State/Province"
                      value={formik.values.state} onChange={formik.handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField fullWidth id="postalCode" name="postalCode" label="Postal Code"
                      value={formik.values.postalCode} onChange={formik.handleChange} />
                  </Grid>
                </>
              )}
              {(formik.values.locationType === 'virtual' || formik.values.locationType === 'hybrid') && (
                <Grid item xs={12}>
                  <TextField fullWidth id="virtualMeetingLink" name="virtualMeetingLink"
                    label="Virtual Meeting Link (Zoom, Meet, etc.)"
                    value={formik.values.virtualMeetingLink} onChange={formik.handleChange} />
                </Grid>
              )}
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Scheduling Information</Typography>
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

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Requirements & Additional Information</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch id="backgroundCheckRequired" name="backgroundCheckRequired"
                    checked={formik.values.backgroundCheckRequired} onChange={formik.handleChange} />}
                  label="Background Check Required" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch id="trainingRequired" name="trainingRequired"
                    checked={formik.values.trainingRequired} onChange={formik.handleChange} />}
                  label="Training Required" />
              </Grid>
              {formik.values.trainingRequired && (
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={3} id="trainingDetails" name="trainingDetails"
                    label="Training Details" placeholder="Describe what training will be provided..."
                    value={formik.values.trainingDetails} onChange={formik.handleChange} />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} id="physicalRequirements" name="physicalRequirements"
                  label="Physical Requirements (Optional)"
                  placeholder="Any physical requirements for this opportunity..."
                  value={formik.values.physicalRequirements} onChange={formik.handleChange} />
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
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                Update Opportunity
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default EditOpportunity;