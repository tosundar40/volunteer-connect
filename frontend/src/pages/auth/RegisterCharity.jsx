import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Link as MuiLink,
  FormControl,
  FormLabel,
  Checkbox,
  FormHelperText,
  CircularProgress,
  Grid,
  MenuItem,
  Chip,
  OutlinedInput,
  Select,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { loginSuccess } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';

const areasOfFocusOptions = [
  'Education',
  'Healthcare',
  'Environment',
  'Animal Welfare',
  'Community Development',
  'Arts & Culture',
  'Sports & Recreation',
  'Elderly Care',
  'Youth Development',
  'Homelessness',
  'Disaster Relief',
  'Human Rights',
  'Mental Health',
  'Food Security',
  'Other'
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
  phoneNumber: yup.string().required('Phone number is required'),
  organizationName: yup.string().required('Organization name is required'),
  registrationNumber: yup.string().required('Registration/Tax ID number is required'),
  description: yup.string().min(50, 'Please provide at least 50 characters').required('Description is required'),
  missionStatement: yup.string().min(50, 'Please provide at least 50 characters').required('Mission statement is required'),
  areasOfFocus: yup.array().min(1, 'Select at least one area of focus'),
  websiteUrl: yup.string().url('Invalid URL format'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State/Province is required'),
  postalCode: yup.string().required('Postal code is required'),
  country: yup.string().required('Country is required'),
  contactPhone: yup.string().required('Contact phone is required'),
  consentGiven: yup.boolean().oneOf([true], 'You must consent to data processing'),
});

const RegisterCharity = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      role: 'charity',
      organizationName: '',
      registrationNumber: '',
      description: '',
      missionStatement: '',
      areasOfFocus: [],
      websiteUrl: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      contactPhone: '',
      consentGiven: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { confirmPassword, ...registerData } = values;
        const response = await authService.register(registerData);
        dispatch(loginSuccess(response));
        toast.success('Registration successful! Your application is pending admin approval.');
        navigate('/charity/dashboard');
      } catch (error) {
        toast.error(error.response?.data?.error || 'Registration failed');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            Register as Charity
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Your application will be reviewed by admin before approval
          </Typography>

          <form onSubmit={formik.handleSubmit}>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="firstName"
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
                  id="lastName"
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
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
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
                  id="phoneNumber"
                  name="phoneNumber"
                  label="Phone Number"
                  value={formik.values.phoneNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
                  helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Organization Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="organizationName"
                  name="organizationName"
                  label="Organization Name"
                  value={formik.values.organizationName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.organizationName && Boolean(formik.errors.organizationName)}
                  helperText={formik.touched.organizationName && formik.errors.organizationName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="registrationNumber"
                  name="registrationNumber"
                  label="Registration/Tax ID Number"
                  value={formik.values.registrationNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.registrationNumber && Boolean(formik.errors.registrationNumber)}
                  helperText={formik.touched.registrationNumber && formik.errors.registrationNumber}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  id="description"
                  name="description"
                  label="Organization Description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  id="missionStatement"
                  name="missionStatement"
                  label="Mission Statement"
                  value={formik.values.missionStatement}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.missionStatement && Boolean(formik.errors.missionStatement)}
                  helperText={formik.touched.missionStatement && formik.errors.missionStatement}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth error={formik.touched.areasOfFocus && Boolean(formik.errors.areasOfFocus)}>
                  <FormLabel>Areas of Focus</FormLabel>
                  <Select
                    multiple
                    id="areasOfFocus"
                    name="areasOfFocus"
                    value={formik.values.areasOfFocus}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    input={<OutlinedInput />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {areasOfFocusOptions.map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.areasOfFocus && formik.errors.areasOfFocus && (
                    <FormHelperText>{formik.errors.areasOfFocus}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="websiteUrl"
                  name="websiteUrl"
                  label="Website URL (Optional)"
                  value={formik.values.websiteUrl}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.websiteUrl && Boolean(formik.errors.websiteUrl)}
                  helperText={formik.touched.websiteUrl && formik.errors.websiteUrl}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Contact Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="address"
                  name="address"
                  label="Address"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.address && Boolean(formik.errors.address)}
                  helperText={formik.touched.address && formik.errors.address}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="city"
                  name="city"
                  label="City"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.city && Boolean(formik.errors.city)}
                  helperText={formik.touched.city && formik.errors.city}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="state"
                  name="state"
                  label="State/Province"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.state && Boolean(formik.errors.state)}
                  helperText={formik.touched.state && formik.errors.state}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="postalCode"
                  name="postalCode"
                  label="Postal Code"
                  value={formik.values.postalCode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
                  helperText={formik.touched.postalCode && formik.errors.postalCode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="country"
                  name="country"
                  label="Country"
                  value={formik.values.country}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.country && Boolean(formik.errors.country)}
                  helperText={formik.touched.country && formik.errors.country}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="contactPhone"
                  name="contactPhone"
                  label="Contact Phone"
                  value={formik.values.contactPhone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactPhone && Boolean(formik.errors.contactPhone)}
                  helperText={formik.touched.contactPhone && formik.errors.contactPhone}
                />
              </Grid>
            </Grid>

            <FormControl error={formik.touched.consentGiven && Boolean(formik.errors.consentGiven)} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Checkbox
                  id="consentGiven"
                  name="consentGiven"
                  checked={formik.values.consentGiven}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <Typography variant="body2" sx={{ mt: 1.2 }}>
                  I consent to the processing of my personal data and agree to the Terms of Service and Privacy Policy. I understand that my application will be reviewed by admin.
                </Typography>
              </Box>
              {formik.touched.consentGiven && formik.errors.consentGiven && (
                <FormHelperText>{formik.errors.consentGiven}</FormHelperText>
              )}
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Application'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <MuiLink component={Link} to="/login" underline="hover">
                  Login
                </MuiLink>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Want to register as volunteer?{' '}
                <MuiLink component={Link} to="/register" underline="hover">
                  Register as Volunteer
                </MuiLink>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterCharity;
