import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container, Typography, Paper, Box, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Chip, OutlinedInput,
  FormControlLabel, Checkbox, Switch, Divider, Alert, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, FormLabel, RadioGroup,
  Radio, Slider, Card, CardContent, List, ListItem, ListItemText,
  ListItemIcon, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, FormHelperText
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, Person as PersonIcon,
  LocationOn as LocationIcon, Schedule as ScheduleIcon,
  Work as WorkIcon, School as SchoolIcon, Notifications as NotificationsIcon,
  Security as SecurityIcon, Edit as EditIcon, Save as SaveIcon,
  Cancel as CancelIcon, Add as AddIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Constants for form options
const interestCategories = [
  'Education', 'Healthcare', 'Environment', 'Animal Welfare',
  'Community Development', 'Arts & Culture', 'Sports & Recreation',
  'Elderly Care', 'Youth Development', 'Homelessness', 'Disaster Relief',
  'Human Rights', 'Mental Health', 'Food Security', 'Technology', 'Other'
];

const skillOptions = [
  'Teaching', 'Counseling', 'First Aid', 'Event Planning', 'Fundraising',
  'Marketing', 'Social Media', 'Photography', 'Video Editing', 'Graphic Design',
  'Web Development', 'Data Entry', 'Administration', 'Customer Service',
  'Public Speaking', 'Translation', 'Cooking', 'Driving', 'Manual Labor',
  'Childcare', 'Elderly Care', 'Animal Care', 'Gardening', 'Construction',
  'Medical/Healthcare', 'Legal Assistance', 'Financial Planning', 'Other'
];

const qualificationTypes = [
  'High School Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD',
  'Professional Certificate', 'Trade Certification', 'First Aid Certified',
  'CPR Certified', 'Teaching Certificate', 'Medical License',
  'Driver\'s License', 'Language Certification', 'Other'
];

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const timeSlots = [
  'Early Morning (6-9 AM)', 'Morning (9-12 PM)', 'Afternoon (12-5 PM)',
  'Evening (5-8 PM)', 'Night (8-11 PM)', 'Late Night (11 PM-6 AM)'
];

const frequencyOptions = [
  'Daily', 'Several times a week', 'Weekly', 'Bi-weekly',
  'Monthly', 'Occasionally', 'Flexible'
];

const validationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string(),
  dateOfBirth: yup.date(),
  bio: yup.string().max(1000, 'Bio must be less than 1000 characters'),
  city: yup.string(),
  state: yup.string(),
  postalCode: yup.string(),
  country: yup.string(),
  maxTravelDistance: yup.number().min(0).max(500)
});

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [newQualification, setNewQualification] = useState('');
  const [qualificationDialogOpen, setQualificationDialogOpen] = useState(false);

  // Fetch volunteer profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setProfile(data.data);
      } catch (error) {
        toast.error('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: null,
      bio: '',
      skills: [],
      interests: [],
      qualifications: [],
      experience: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      maxTravelDistance: 10,
      availability: {
        days: [],
        times: [],
        frequency: 'flexible'
      },
      isAvailableForEmergency: false,
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      notificationPreferences: {
        email: true,
        sms: false,
        push: true,
        frequency: 'immediate',
        opportunityUpdates: true,
        applicationUpdates: true,
        generalNews: false
      },
      privacySettings: {
        profileVisible: true,
        contactInfoVisible: false,
        skillsVisible: true,
        availabilityVisible: true
      }
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        // Prepare data in the format expected by backend
        const updateData = {
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber,
          volunteer: {
            dateOfBirth: values.dateOfBirth,
            bio: values.bio,
            skills: values.skills,
            interests: values.interests,
            qualifications: values.qualifications,
            experience: values.experience,
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            country: values.country,
            maxTravelDistance: values.maxTravelDistance,
            availability: values.availability,
            isAvailableForEmergency: values.isAvailableForEmergency,
            emergencyContactName: values.emergencyContactName,
            emergencyContactPhone: values.emergencyContactPhone,
            emergencyContactRelation: values.emergencyContactRelation,
            notificationPreferences: values.notificationPreferences,
            privacySettings: values.privacySettings
          }
        };
        
        await api.put('/auth/profile', updateData);
        toast.success('Profile updated successfully!');
        setEditingSection(null);
        // Refresh profile data
        const { data } = await api.get('/auth/profile');
        setProfile(data.data);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      } finally {
        setSaving(false);
      }
    }
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      const volunteer = profile.volunteer || {};
      formik.setValues({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        dateOfBirth: volunteer.dateOfBirth ? new Date(volunteer.dateOfBirth) : null,
        bio: volunteer.bio || '',
        skills: volunteer.skills || [],
        interests: volunteer.interests || [],
        qualifications: volunteer.qualifications || [],
        experience: volunteer.experience || '',
        city: volunteer.city || '',
        state: volunteer.state || '',
        postalCode: volunteer.postalCode || '',
        country: volunteer.country || '',
        maxTravelDistance: volunteer.maxTravelDistance || 10,
        availability: volunteer.availability || { days: [], times: [], frequency: 'flexible' },
        isAvailableForEmergency: volunteer.isAvailableForEmergency || false,
        emergencyContactName: volunteer.emergencyContactName || '',
        emergencyContactPhone: volunteer.emergencyContactPhone || '',
        emergencyContactRelation: volunteer.emergencyContactRelation || '',
        notificationPreferences: volunteer.notificationPreferences || {
          email: true, sms: false, push: true, frequency: 'immediate',
          opportunityUpdates: true, applicationUpdates: true, generalNews: false
        },
        privacySettings: volunteer.privacySettings || {
          profileVisible: true, contactInfoVisible: false,
          skillsVisible: true, availabilityVisible: true
        }
      });
    }
  }, [profile]);

  const addQualification = () => {
    if (newQualification.trim()) {
      formik.setFieldValue('qualifications', [
        ...formik.values.qualifications,
        newQualification.trim()
      ]);
      setNewQualification('');
      setQualificationDialogOpen(false);
    }
  };

  const removeQualification = (index) => {
    const updatedQualifications = formik.values.qualifications.filter((_, i) => i !== index);
    formik.setFieldValue('qualifications', updatedQualifications);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Volunteer Profile
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Complete your profile to get matched with relevant volunteering opportunities
        </Typography>

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon />
                    <Typography variant="h6">Personal Information</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="firstName"
                        label="First Name"
                        value={formik.values.firstName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                        helperText={formik.touched.firstName && formik.errors.firstName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="lastName"
                        label="Last Name"
                        value={formik.values.lastName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                        helperText={formik.touched.lastName && formik.errors.lastName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="email"
                        label="Email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.email && Boolean(formik.errors.email)}
                        helperText={formik.touched.email && formik.errors.email}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="phoneNumber"
                        label="Phone Number"
                        value={formik.values.phoneNumber}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Date of Birth"
                        value={formik.values.dateOfBirth}
                        onChange={(value) => formik.setFieldValue('dateOfBirth', value)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        name="bio"
                        label="Bio (Tell others about yourself)"
                        value={formik.values.bio}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.bio && Boolean(formik.errors.bio)}
                        helperText={formik.touched.bio && formik.errors.bio}
                        placeholder="Share your motivation for volunteering, background, and what you hope to achieve..."
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Location Preferences */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon />
                    <Typography variant="h6">Location & Travel Preferences</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="city"
                        label="City"
                        value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        name="state"
                        label="State/Province"
                        value={formik.values.state}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        name="postalCode"
                        label="Postal Code"
                        value={formik.values.postalCode}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="country"
                        label="Country"
                        value={formik.values.country}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>
                        Maximum Travel Distance: {formik.values.maxTravelDistance} km
                      </Typography>
                      <Slider
                        value={formik.values.maxTravelDistance}
                        onChange={(_, value) => formik.setFieldValue('maxTravelDistance', value)}
                        min={0}
                        max={100}
                        marks={[
                          { value: 0, label: '0km' },
                          { value: 25, label: '25km' },
                          { value: 50, label: '50km' },
                          { value: 100, label: '100km+' }
                        ]}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Skills & Interests */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon />
                    <Typography variant="h6">Skills & Interests</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Skills</InputLabel>
                        <Select
                          multiple
                          name="skills"
                          value={formik.values.skills}
                          onChange={(e) => formik.setFieldValue('skills', e.target.value)}
                          input={<OutlinedInput label="Skills" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {skillOptions.map((skill) => (
                            <MenuItem key={skill} value={skill}>
                              {skill}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Areas of Interest</InputLabel>
                        <Select
                          multiple
                          name="interests"
                          value={formik.values.interests}
                          onChange={(e) => formik.setFieldValue('interests', e.target.value)}
                          input={<OutlinedInput label="Areas of Interest" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" color="secondary" />
                              ))}
                            </Box>
                          )}
                        >
                          {interestCategories.map((interest) => (
                            <MenuItem key={interest} value={interest}>
                              {interest}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        name="experience"
                        label="Previous Volunteering Experience"
                        value={formik.values.experience}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Describe your previous volunteering experience, achievements, or relevant background..."
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Qualifications */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon />
                    <Typography variant="h6">Qualifications & Certifications</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2">Add your qualifications and certifications</Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setQualificationDialogOpen(true)}
                      variant="outlined"
                      size="small"
                    >
                      Add Qualification
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formik.values.qualifications.map((qual, index) => (
                      <Chip
                        key={index}
                        label={qual}
                        onDelete={() => removeQualification(index)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {formik.values.qualifications.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No qualifications added yet
                      </Typography>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Availability */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon />
                    <Typography variant="h6">Availability</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Preferred Days</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {daysOfWeek.map((day) => (
                          <FormControlLabel
                            key={day}
                            control={
                              <Checkbox
                                checked={formik.values.availability.days.includes(day)}
                                onChange={(e) => {
                                  const days = e.target.checked
                                    ? [...formik.values.availability.days, day]
                                    : formik.values.availability.days.filter(d => d !== day);
                                  formik.setFieldValue('availability.days', days);
                                }}
                              />
                            }
                            label={day}
                          />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Preferred Times</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {timeSlots.map((time) => (
                          <FormControlLabel
                            key={time}
                            control={
                              <Checkbox
                                checked={formik.values.availability.times.includes(time)}
                                onChange={(e) => {
                                  const times = e.target.checked
                                    ? [...formik.values.availability.times, time]
                                    : formik.values.availability.times.filter(t => t !== time);
                                  formik.setFieldValue('availability.times', times);
                                }}
                              />
                            }
                            label={time}
                          />
                        ))}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          name="frequency"
                          value={formik.values.availability.frequency}
                          onChange={(e) => formik.setFieldValue('availability.frequency', e.target.value)}
                          label="Frequency"
                        >
                          {frequencyOptions.map((freq) => (
                            <MenuItem key={freq} value={freq.toLowerCase()}>
                              {freq}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.isAvailableForEmergency}
                            onChange={(e) => formik.setFieldValue('isAvailableForEmergency', e.target.checked)}
                          />
                        }
                        label="Available for emergency volunteering opportunities"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Emergency Contact */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon />
                    <Typography variant="h6">Emergency Contact</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        name="emergencyContactName"
                        label="Emergency Contact Name"
                        value={formik.values.emergencyContactName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        name="emergencyContactPhone"
                        label="Emergency Contact Phone"
                        value={formik.values.emergencyContactPhone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        name="emergencyContactRelation"
                        label="Relationship"
                        value={formik.values.emergencyContactRelation}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="e.g., Spouse, Parent, Friend"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Notification Preferences */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsIcon />
                    <Typography variant="h6">Notification Preferences</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Notification Methods</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.notificationPreferences.email}
                            onChange={(e) => formik.setFieldValue('notificationPreferences.email', e.target.checked)}
                          />
                        }
                        label="Email Notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.notificationPreferences.sms}
                            onChange={(e) => formik.setFieldValue('notificationPreferences.sms', e.target.checked)}
                          />
                        }
                        label="SMS Notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.notificationPreferences.push}
                            onChange={(e) => formik.setFieldValue('notificationPreferences.push', e.target.checked)}
                          />
                        }
                        label="Push Notifications"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Notification Types</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.notificationPreferences.opportunityUpdates}
                            onChange={(e) => formik.setFieldValue('notificationPreferences.opportunityUpdates', e.target.checked)}
                          />
                        }
                        label="New Opportunity Matches"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.notificationPreferences.applicationUpdates}
                            onChange={(e) => formik.setFieldValue('notificationPreferences.applicationUpdates', e.target.checked)}
                          />
                        }
                        label="Application Status Updates"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.notificationPreferences.generalNews}
                            onChange={(e) => formik.setFieldValue('notificationPreferences.generalNews', e.target.checked)}
                          />
                        }
                        label="General Platform News"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Notification Frequency</InputLabel>
                        <Select
                          value={formik.values.notificationPreferences.frequency}
                          onChange={(e) => formik.setFieldValue('notificationPreferences.frequency', e.target.value)}
                          label="Notification Frequency"
                        >
                          <MenuItem value="immediate">Immediate</MenuItem>
                          <MenuItem value="daily">Daily Digest</MenuItem>
                          <MenuItem value="weekly">Weekly Summary</MenuItem>
                          <MenuItem value="monthly">Monthly Updates</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Privacy Settings */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon />
                    <Typography variant="h6">Privacy Settings</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Control what information is visible to charity organizations when they search for volunteers
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.privacySettings.profileVisible}
                            onChange={(e) => formik.setFieldValue('privacySettings.profileVisible', e.target.checked)}
                          />
                        }
                        label="Make my profile visible in volunteer searches"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.privacySettings.contactInfoVisible}
                            onChange={(e) => formik.setFieldValue('privacySettings.contactInfoVisible', e.target.checked)}
                          />
                        }
                        label="Show contact information to matched organizations"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.privacySettings.skillsVisible}
                            onChange={(e) => formik.setFieldValue('privacySettings.skillsVisible', e.target.checked)}
                          />
                        }
                        label="Show skills and qualifications"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formik.values.privacySettings.availabilityVisible}
                            onChange={(e) => formik.setFieldValue('privacySettings.availabilityVisible', e.target.checked)}
                          />
                        }
                        label="Show availability schedule"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Save Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Add Qualification Dialog */}
        <Dialog open={qualificationDialogOpen} onClose={() => setQualificationDialogOpen(false)}>
          <DialogTitle>Add Qualification</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Qualification</InputLabel>
              <Select
                value={newQualification}
                onChange={(e) => setNewQualification(e.target.value)}
                label="Select Qualification"
              >
                {qualificationTypes.map((qual) => (
                  <MenuItem key={qual} value={qual}>
                    {qual}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Custom Qualification"
              value={newQualification}
              onChange={(e) => setNewQualification(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Or enter a custom qualification"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQualificationDialogOpen(false)}>Cancel</Button>
            <Button onClick={addQualification} variant="contained">Add</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default Profile;
