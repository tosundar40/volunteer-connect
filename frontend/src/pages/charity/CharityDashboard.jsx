import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Web as WebIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import api, { BASE_URL } from "../../services/api";

const CharityDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [charityData, setCharityData] = useState(null);
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    activeOpportunities: 0,
    completedOpportunities: 0,
    totalVolunteers: 0,
    pendingApplications: 0,
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [charityResponse, statsResponse] = await Promise.all([
        api.get("/charity/profile"),
        api.get("/charity/stats"),
      ]);

      setCharityData(charityResponse.data.data);
      setStats(statsResponse.data.data || stats);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          color: "warning",
          text: "Pending Review",
          description: "Your application is under review by our moderators.",
        };
      case "approved":
        return {
          color: "success",
          text: "Approved",
          description: "Your charity is verified and can create opportunities.",
        };
      case "rejected":
        return {
          color: "error",
          text: "Rejected",
          description: "Your application was not approved.",
        };
      default:
        return {
          color: "default",
          text: "Unknown",
          description: "Status unclear.",
        };
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  const statusInfo = getStatusInfo(charityData?.verificationStatus);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          <DashboardIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Charity Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/charity/opportunities/create")}
          disabled={charityData?.verificationStatus !== "approved"}
        >
          Create Opportunity
        </Button>
      </Box>

      {/* Verification Status Alert */}
      <Alert
        severity={statusInfo.color}
        sx={{ mb: 3 }}
        action={
          charityData?.verificationStatus === "approved" && (
            <Button
              color="inherit"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => navigate("/charity/profile")}
            >
              Edit Profile
            </Button>
          )
        }
      >
        <Typography variant="h6">Status: {statusInfo.text}</Typography>
        <Typography variant="body2">
          {statusInfo.description}
          {charityData?.verificationNotes &&
            ` Note: ${charityData.verificationNotes}`}
        </Typography>
      </Alert>

      {stats.pendingApplications > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate('/charity/applications')}
            >
              Review Applications
            </Button>
          }
        >
          <Typography variant="body2">
            You have {stats.pendingApplications} pending application{stats.pendingApplications > 1 ? 's' : ''}. Please review them on the Applications page.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <EventIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">
                    {stats.totalOpportunities}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Opportunities
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <EventIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">
                    {stats.activeOpportunities}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Opportunities
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <PeopleIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">{stats.totalVolunteers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Volunteers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid> */}

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <EventIcon color="secondary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">
                    {stats.completedOpportunities}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <PeopleIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4">
                    {stats.pendingApplications}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Applications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Organization Profile */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar
                sx={{ width: 80, height: 80, mr: 2 }}
                src={charityData?.logo ? `${BASE_URL}${charityData.logo}` : null}
                alt={charityData?.organizationName}
              >
                {charityData?.organizationName?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h5">
                  {charityData?.organizationName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registration: {charityData?.registrationNumber}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={statusInfo.text}
                    color={statusInfo.color}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {charityData?.rating && (
                    <Chip
                      icon={<StarIcon />}
                      label={`${charityData.rating}/5.0`}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Mission Statement
            </Typography>
            <Typography variant="body1" paragraph>
              {charityData?.missionStatement ||
                "No mission statement provided."}
            </Typography>

            <Typography variant="h6" gutterBottom>
              Areas of Focus
            </Typography>
            <Box sx={{ mb: 2 }}>
              {charityData?.areasOfFocus?.map((area) => (
                <Chip key={area} label={area} sx={{ mr: 1, mb: 1 }} />
              )) || (
                <Typography variant="body2" color="text.secondary">
                  No areas specified.
                </Typography>
              )}
            </Box>

            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1">
              {charityData?.description || "No description provided."}
            </Typography>
          </Paper>
        </Grid>

        {/* Contact & Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <List dense>
              {charityData?.contactEmail && (
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText primary={charityData.contactEmail} />
                </ListItem>
              )}
              {charityData?.contactPhone && (
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText primary={charityData.contactPhone} />
                </ListItem>
              )}
              {charityData?.websiteUrl && (
                <ListItem>
                  <ListItemIcon>
                    <WebIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <a
                        href={charityData.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        {charityData.websiteUrl}
                      </a>
                    }
                  />
                </ListItem>
              )}
              {(charityData?.address || charityData?.city) && (
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${charityData?.address || ""} ${
                      charityData?.city || ""
                    }`}
                    secondary={`${charityData?.state || ""} ${
                      charityData?.postalCode || ""
                    } ${charityData?.country || ""}`}
                  />
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/charity/profile")}
                startIcon={<EditIcon />}
              >
                Edit Profile
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/charity/opportunities")}
                startIcon={<EventIcon />}
              >
                Manage Opportunities
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/charity/opportunities/create")}
                startIcon={<AddIcon />}
                disabled={charityData?.verificationStatus !== "approved"}
              >
                Create Opportunity
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CharityDashboard;
