import { useState, useEffect } from 'react';
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
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { loginSuccess } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';

const validationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  role: yup.string().oneOf(['volunteer', 'charity']).required('Please select a role'),
  phoneNumber: yup.string(),
  consentGiven: yup.boolean().oneOf([true], 'You must consent to data processing'),
});

const Register = () => {
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
      role: 'volunteer',
      phoneNumber: '',
      consentGiven: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { confirmPassword, ...registerData } = values;
        const response = await authService.register(registerData);
        dispatch(loginSuccess(response));
        toast.success('Registration successful!');
        
        // Redirect to profile completion page based on role
        if (values.role === 'volunteer') {
          navigate('/volunteer/profile');
        } else if (values.role === 'charity') {
          navigate('/charity/profile');
        }
      } catch (error) {
        toast.error(error.response?.data?.error || 'Registration failed');
      } finally {
        setLoading(false);
      }
    },
  });

  // Redirect to specific registration page when role is selected
  useEffect(() => {
    if (formik.values.role === 'charity') {
      navigate('/register-charity');
    } else if (formik.values.role === 'volunteer') {
      navigate('/register-volunteer');
    }
  }, [formik.values.role, navigate]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            Register
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Create your account to get started
          </Typography>

          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2 }}>
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
                margin="normal"
              />

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
                margin="normal"
              />
            </Box>

            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              margin="normal"
            />

            <TextField
              fullWidth
              id="phoneNumber"
              name="phoneNumber"
              label="Phone Number (Optional)"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              margin="normal"
            />

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
              margin="normal"
            />

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
              margin="normal"
            />

            <FormControl component="fieldset" margin="normal" error={formik.touched.role && Boolean(formik.errors.role)}>
              <FormLabel component="legend">I want to register as:</FormLabel>
              <RadioGroup
                row
                name="role"
                value={formik.values.role}
                onChange={formik.handleChange}
              >
                <FormControlLabel value="volunteer" control={<Radio />} label="Volunteer" />
                <FormControlLabel value="charity" control={<Radio />} label="Charity" />
              </RadioGroup>
              {formik.touched.role && formik.errors.role && (
                <FormHelperText>{formik.errors.role}</FormHelperText>
              )}
            </FormControl>

            <FormControl error={formik.touched.consentGiven && Boolean(formik.errors.consentGiven)} sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="consentGiven"
                    checked={formik.values.consentGiven}
                    onChange={formik.handleChange}
                  />
                }
                label="I consent to the processing of my personal data in accordance with GDPR regulations"
              />
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
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <MuiLink component={Link} to="/login">
                  Login here
                </MuiLink>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Want to register as charity?{' '}
                <MuiLink component={Link} to="/register-charity">
                  Register as Charity
                </MuiLink>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
