import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container, Box, TextField, Button, Typography, Paper, Link as MuiLink,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Checkbox,
  FormHelperText, CircularProgress, Stepper, Step, StepLabel, Grid,
  InputLabel, Select, MenuItem, Chip, OutlinedInput, Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { loginSuccess } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';

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
  'Childcare', 'Elderly Care', 'Animal Care', 'Gardening', 'Construction', 'Other'
];

const validationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  phoneNumber: yup.string(),
  dateOfBirth: yup.date().max(new Date(), 'Date of birth cannot be in the future'),
  city: yup.string(),
  skills: yup.array().min(1, 'Select at least one skill').required('Select at least one skill'),
  interests: yup.array().min(1, 'Select at least one area of interest').required('Select at least one area of interest'),
  consentGiven: yup.boolean().oneOf([true], 'You must consent to data processing'),
});

const RegisterVolunteer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    'Basic Information',
    'Location & Preferences',
    'Skills & Interests'
  ];

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      dateOfBirth: null,
      city: '',
      state: '',
      country: '',
      bio: '',
      skills: [],
      interests: [],
      maxTravelDistance: 10,
      consentGiven: false,
      role: 'volunteer'
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { confirmPassword, ...registerData } = values;
        
        // Prepare volunteer-specific data
        const volunteerData = {
          ...registerData,
          volunteer: {
            dateOfBirth: registerData.dateOfBirth,
            city: registerData.city,
            state: registerData.state,
            country: registerData.country,
            bio: registerData.bio,
            skills: registerData.skills,
            interests: registerData.interests,
            maxTravelDistance: registerData.maxTravelDistance,
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
          }
        };

        const response = await authService.register(volunteerData);
        dispatch(loginSuccess(response));
        toast.success('Registration successful! Welcome to the platform!');
        navigate('/volunteer/profile');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Registration failed');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const skillsRef = useRef(null);
  const interestsRef = useRef(null);

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    const errors = await formik.validateForm();
    if (errors.skills || errors.interests) {
      formik.setTouched({
        ...formik.touched,
        skills: true,
        interests: true,
      });
      if (errors.skills && skillsRef.current) {
        // focus the underlying input element
        skillsRef.current.focus();
      } else if (errors.interests && interestsRef.current) {
        interestsRef.current.focus();
      }
      return;
    }

    formik.handleSubmit();
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return formik.values.firstName && formik.values.lastName && 
               formik.values.email && formik.values.password && 
               formik.values.confirmPassword && formik.values.consentGiven;
      case 1:
        return true; // Optional fields
      case 2:
        return (
          Array.isArray(formik.values.skills) && formik.values.skills.length > 0 &&
          Array.isArray(formik.values.interests) && formik.values.interests.length > 0
        );
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
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
                required
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
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="password"
                label="Password"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                required
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
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                    helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="consentGiven"
                    checked={formik.values.consentGiven}
                    onChange={formik.handleChange}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I consent to the processing of my personal data and agree to the{' '}
                    <MuiLink href="/terms" target="_blank">Terms of Service</MuiLink>
                    {' '}and{' '}
                    <MuiLink href="/privacy" target="_blank">Privacy Policy</MuiLink>
                  </Typography>
                }
              />
              {formik.touched.consentGiven && formik.errors.consentGiven && (
                <FormHelperText error>{formik.errors.consentGiven}</FormHelperText>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Location Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Help us match you with local volunteering opportunities
              </Typography>
            </Grid>
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
                name="country"
                label="Country"
                value={formik.values.country}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Maximum Travel Distance: {formik.values.maxTravelDistance} km
              </Typography>
              <Box sx={{ px: 2 }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formik.values.maxTravelDistance}
                  onChange={(e) => formik.setFieldValue('maxTravelDistance', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="bio"
                label="Brief Bio (Optional)"
                value={formik.values.bio}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Tell us a bit about yourself and why you want to volunteer..."
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Skills & Interests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select your skills and areas of interest to get better opportunity matches
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={formik.touched.skills && Boolean(formik.errors.skills)}>
                <InputLabel>Skills (Select all that apply)</InputLabel>
                <Select
                  multiple
                  name="skills"
                  value={formik.values.skills}
                  onChange={(e) => formik.setFieldValue('skills', e.target.value)}
                  input={<OutlinedInput label="Skills (Select all that apply)" inputRef={skillsRef} />}
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
                {formik.touched.skills && formik.errors.skills && (
                  <FormHelperText error>{formik.errors.skills}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={formik.touched.interests && Boolean(formik.errors.interests)}>
                <InputLabel>Areas of Interest</InputLabel>
                <Select
                  multiple
                  name="interests"
                  value={formik.values.interests}
                  onChange={(e) => formik.setFieldValue('interests', e.target.value)}
                  input={<OutlinedInput label="Areas of Interest" inputRef={interestsRef} />}
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
                {formik.touched.interests && formik.errors.interests && (
                  <FormHelperText error>{formik.errors.interests}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Don't worry if you don't see your exact skills or interests listed - you can always update 
                these and add more details in your profile after registration!
              </Typography>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md">
        <Box sx={{ mt: 8, mb: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom textAlign="center">
              Volunteer Registration
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
              Join our community of volunteers and make a difference
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <form onSubmit={formik.handleSubmit}>
              {renderStepContent()}

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  {activeStep > 0 && (
                    <Button onClick={handleBack} sx={{ mr: 1 }}>
                      Back
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {activeStep < steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!isStepValid()}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="contained"
                      onClick={handleFinalSubmit}
                      disabled={loading}
                      startIcon={loading && <CircularProgress size={20} />}
                    >
                      {loading ? 'Creating Account...' : 'Complete Registration'}
                    </Button>
                  )}
                </Box>
              </Box>
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <MuiLink component={Link} to="/login">
                  Sign in
                </MuiLink>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Want to register as a charity?{' '}
                <MuiLink component={Link} to="/register-charity">
                  Register here
                </MuiLink>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default RegisterVolunteer;