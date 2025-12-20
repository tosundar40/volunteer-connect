import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkIcon from "@mui/icons-material/Work";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import ApplicationIcon from "@mui/icons-material/Assignment";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PeopleIcon from "@mui/icons-material/People";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import HistoryIcon from "@mui/icons-material/History";
import { logout } from "../../store/slices/authSlice";
import { authService } from "../../services/authService";
import { BASE_URL } from "../../services/api";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
    handleCloseUserMenu();
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    const dashboards = {
      volunteer: "/volunteer/dashboard",
      charity: "/charity/dashboard",
      moderator: "/moderator/dashboard",
    };
    return dashboards[user.role] || "/";
  };

  const getProfileLink = () => {
    if (!user) return "/";
    const profiles = {
      volunteer: "/volunteer/profile",
      charity: "/charity/profile",
    };
    return profiles[user.role] || "/";
  };

  // Role-specific navigation items
  const getNavigationItems = () => {
    const publicNavigation = [
      {
        label: "Find Opportunities",
        path: "/opportunities",
        icon: <WorkIcon />,
      },
    ];

    // Only return role-based navigation when explicitly authenticated and user exists
    if (isAuthenticated !== true || !user) return publicNavigation;

    switch (user.role) {
      case "volunteer":
        return [
          {
            label: "Dashboard",
            path: "/volunteer/dashboard",
            icon: <DashboardIcon />,
          },
          {
            label: "Find Opportunities",
            path: "/opportunities",
            icon: <WorkIcon />,
          },
          {
            label: "My Applications",
            path: "/volunteer/applications",
            icon: <ApplicationIcon />,
          },
          {
            label: "Attendance History",
            path: "/volunteer/attendance",
            icon: <HistoryIcon />,
          },
          {
            label: "Profile",
            path: "/volunteer/profile",
            icon: <PersonIcon />,
          },
        ];

      case "charity": {
        const charityStatus = user?.charity?.verificationStatus;

        const createDisabled = charityStatus === "pending";
        return [
          {
            label: "Dashboard",
            path: "/charity/dashboard",
            icon: <DashboardIcon />,
          },
          {
            label: "My Opportunities",
            path: "/charity/opportunities",
            icon: <WorkIcon />,
          },
          {
            label: "Create Opportunity",
            path: "/charity/opportunities/create",
            icon: <AddCircleIcon />,
            disabled: createDisabled,
            disabledReason: createDisabled
              ? "Your charity verification is pending"
              : "",
          },
          {
            label: "Applications",
            path: "/charity/applications",
            icon: <ApplicationIcon />,
          },
          {
            label: "Profile",
            path: "/charity/profile",
            icon: <BusinessIcon />,
          },
        ];
      }

      case "moderator":
        return [
          {
            label: "Dashboard",
            path: "/moderator/dashboard",
            icon: <DashboardIcon />,
          },
          {
            label: "Manage Users",
            path: "/moderator/management",
            icon: <AdminPanelSettingsIcon />,
          },
          {
            label: "Opportunities Management",
            path: "/moderator/opportunities",
            icon: <WorkIcon />,
          },
          {
            label: "All Opportunities",
            path: "/opportunities",
            icon: <WorkIcon />,
          },
        ];

      default:
        return publicNavigation;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <AppBar position="fixed">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo */}
          <VolunteerActivismIcon
            sx={{ display: { xs: "none", md: "flex" }, mr: 1 }}
          />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontWeight: 700,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Volunteering Platform
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="menu"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {navigationItems.map((item) => (
                <Tooltip
                  key={item.path}
                  title={item.disabled ? item.disabledReason : ""}
                >
                  <MenuItem
                    onClick={handleCloseNavMenu}
                    component={item.disabled ? "div" : Link}
                    to={item.disabled ? undefined : item.path}
                    disabled={item.disabled}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {item.icon}
                      <Typography textAlign="center">{item.label}</Typography>
                    </Box>
                  </MenuItem>
                </Tooltip>
              ))}
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <VolunteerActivismIcon
            sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}
          />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontWeight: 700,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            VP
          </Typography>

          {/* Desktop Menu */}
          <Box
            sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, gap: 1 }}
          >
            {navigationItems.map((item) => (
              <Tooltip
                key={item.path}
                title={item.disabled ? item.disabledReason : ""}
              >
                <span>
                  <Button
                    component={item.disabled ? "div" : Link}
                    to={item.disabled ? undefined : item.path}
                    startIcon={item.icon}
                    disabled={item.disabled}
                    sx={{
                      my: 2,
                      color: "white",
                      display: "flex",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                </span>
              </Tooltip>
            ))}
          </Box>

          {/* User Menu */}
          {isAuthenticated ? (
            <Box
              sx={{
                flexGrow: 0,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              {/* Role Indicator */}
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                >
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </Typography>
              </Box>

              <Tooltip title="User settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar
                    alt={user?.firstName}
                    src={
                      user?.profileImage
                        ? `${BASE_URL}${user.profileImage}`
                        : null
                    }
                  >
                    {user?.firstName?.[0]}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={handleCloseUserMenu}>
                  <Typography textAlign="center" sx={{ fontWeight: "bold" }}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleCloseUserMenu}>
                  <Typography
                    textAlign="center"
                    variant="caption"
                    color="text.secondary"
                  >
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </Typography>
                </MenuItem>
                {user?.role !== "moderator" && (
                  <MenuItem
                    onClick={handleCloseUserMenu}
                    component={Link}
                    to={getProfileLink()}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PersonIcon fontSize="small" />
                      <Typography textAlign="center">
                        Account Settings
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <Typography textAlign="center" color="error">
                    Logout
                  </Typography>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button component={Link} to="/login" sx={{ color: "white" }}>
                Login
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="outlined"
                sx={{ color: "white", borderColor: "white" }}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
