import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Avatar,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit, PhotoCamera, Save, Cancel } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api, { BASE_URL } from '../../services/api';

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
  organizationName: yup.string().required('Organization name is required'),
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
});

const CharityProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [charityData, setCharityData] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const formik = useFormik({
    initialValues: {
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
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const formData = new FormData();
        
        // Add all form fields
        Object.keys(values).forEach(key => {
          if (key === 'areasOfFocus') {
            formData.append(key, JSON.stringify(values[key]));
          } else {
            formData.append(key, values[key]);
          }
        });

        // Add files if selected
        if (logoFile) {
          formData.append('logo', logoFile);
        }
        if (bannerFile) {
          formData.append('bannerImage', bannerFile);
        }

        await api.put('/charity/profile', formData, {
          headers: {
            'Content-Type': 'form-data',
          },
        });

        toast.success('Profile updated successfully! Changes are subject to admin review.');
        setIsEditing(false);
        fetchCharityData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      } finally {
        setSaving(false);
      }
    },
  });

  const fetchCharityData = async () => {
    try {
      const response = await api.get('/charity/profile');
      setCharityData(response.data.data);
      const charity = response.data.data;
      formik.setValues({
        organizationName: charity.organizationName || '',
        registrationNumber: charity.registrationNumber || '',
        description: charity.description || '',
        missionStatement: charity.missionStatement || '',
        areasOfFocus: charity.areasOfFocus || [],
        websiteUrl: charity.websiteUrl || '',
        address: charity.address || '',
        city: charity.city || '',
        state: charity.state || '',
        postalCode: charity.postalCode || '',
        country: charity.country || '',
        contactPhone: charity.contactPhone || '',
      });
    } catch (error) {
      toast.error('Failed to load charity data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharityData();
  }, []);

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  const handleBannerChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setBannerFile(file);
    } else {
      toast.error('Please select a valid image file');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Profile Header */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <Box
          sx={{
            height: 200,
            backgroundColor: '#f5f5f5',
            backgroundImage: charityData?.bannerImage ? `url(${BASE_URL}${charityData.bannerImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          {isEditing && (
            <Button
              component="label"
              variant="contained"
              startIcon={<PhotoCamera />}
              sx={{ position: 'absolute', top: 16, right: 16 }}
            >
              Change Banner
              <input type="file" hidden accept="image/*" onChange={handleBannerChange} />
            </Button>
          )}
        </Box>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box position="relative">
            <Avatar
              sx={{ width: 100, height: 100 }}
              src={charityData?.logo ? `${BASE_URL}${charityData.logo}` : null}
              alt={charityData?.organizationName}
            >
              {charityData?.organizationName?.charAt(0)}
            </Avatar>
            {isEditing && (
              <Button
                component="label"
                variant="contained"
                size="small"
                startIcon={<PhotoCamera />}
                sx={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)' }}
              >
                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
              </Button>
            )}
          </Box>
          <Box flex={1}>
            <Typography variant="h4" gutterBottom>
              {charityData?.organizationName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Registration: {charityData?.registrationNumber}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={charityData?.verificationStatus} 
                color={charityData?.verificationStatus === 'approved' ? 'success' : 
                       charityData?.verificationStatus === 'pending' ? 'warning' : 'error'} 
                size="small" 
              />
              {charityData?.rating && (
                <Chip label={`${charityData.rating}/5.0 ⭐`} variant="outlined" size="small" />
              )}
            </Box>
          </Box>
          <Box>
            {!isEditing ? (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setIsEditing(true)}
                disabled={charityData?.verificationStatus === 'pending'}
              >
                Edit Profile
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => {
                    setIsEditing(false);
                    formik.resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={formik.handleSubmit}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={20} /> : 'Save'}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {charityData?.verificationStatus === 'pending' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your charity profile is under review. You cannot make changes until approval is complete.
        </Alert>
      )}

      {charityData?.verificationStatus === 'rejected' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Your charity application was rejected. Reason: {charityData?.verificationNotes}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Organization Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Organization Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Organization Name"
                      name="organizationName"
                      value={formik.values.organizationName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.organizationName && Boolean(formik.errors.organizationName)}
                      helperText={formik.touched.organizationName && formik.errors.organizationName}
                      disabled={!isEditing}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Registration Number"
                      name="registrationNumber"
                      value={formik.values.registrationNumber}
                      disabled={true}
                      helperText="Registration number cannot be changed"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      multiline
                      rows={4}
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.description && Boolean(formik.errors.description)}
                      helperText={formik.touched.description && formik.errors.description}
                      disabled={!isEditing}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mission Statement"
                      name="missionStatement"
                      multiline
                      rows={4}
                      value={formik.values.missionStatement}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.missionStatement && Boolean(formik.errors.missionStatement)}
                      helperText={formik.touched.missionStatement && formik.errors.missionStatement}
                      disabled={!isEditing}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Areas of Focus</InputLabel>
                      <Select
                        multiple
                        value={formik.values.areasOfFocus}
                        onChange={(e) => formik.setFieldValue('areasOfFocus', e.target.value)}
                        input={<OutlinedInput label="Areas of Focus" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {areasOfFocusOptions.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Website URL"
                      name="websiteUrl"
                      value={formik.values.websiteUrl}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.websiteUrl && Boolean(formik.errors.websiteUrl)}
                      helperText={formik.touched.websiteUrl && formik.errors.websiteUrl}
                      disabled={!isEditing}
                    />
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact & Location */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact & Location
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.address && Boolean(formik.errors.address)}
                    helperText={formik.touched.address && formik.errors.address}
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.city && Boolean(formik.errors.city)}
                    helperText={formik.touched.city && formik.errors.city}
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    name="state"
                    value={formik.values.state}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.state && Boolean(formik.errors.state)}
                    helperText={formik.touched.state && formik.errors.state}
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    name="postalCode"
                    value={formik.values.postalCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
                    helperText={formik.touched.postalCode && formik.errors.postalCode}
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="country"
                    value={formik.values.country}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.country && Boolean(formik.errors.country)}
                    helperText={formik.touched.country && formik.errors.country}
                    disabled={!isEditing}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    name="contactPhone"
                    value={formik.values.contactPhone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.contactPhone && Boolean(formik.errors.contactPhone)}
                    helperText={formik.touched.contactPhone && formik.errors.contactPhone}
                    disabled={!isEditing}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Volunteers
                  </Typography>
                  <Typography variant="h6">
                    {charityData?.totalVolunteers || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Rating
                  </Typography>
                  <Typography variant="h6">
                    {charityData?.rating || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CharityProfile;