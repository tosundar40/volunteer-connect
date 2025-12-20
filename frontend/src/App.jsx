import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RegisterCharity from './pages/auth/RegisterCharity';
import RegisterVolunteer from './pages/auth/RegisterVolunteer';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Volunteer Pages
import VolunteerDashboard from './pages/volunteer/Dashboard';
import VolunteerProfile from './pages/volunteer/Profile';
import OpportunityList from './pages/opportunities/OpportunityList';
import OpportunityDetail from './pages/opportunities/OpportunityDetail';
import MyApplications from './pages/volunteer/MyApplications';
import ApplicationWorkflow from './pages/volunteer/ApplicationWorkflow';
import AttendanceHistory from './pages/volunteer/AttendanceHistory';

// Charity Pages
import CharityDashboard from './pages/charity/CharityDashboard';
import CharityProfile from './pages/charity/CharityProfile';
import CreateOpportunity from './pages/charity/CreateOpportunity';
import EditOpportunity from './pages/charity/EditOpportunity';
import ManageOpportunities from './pages/charity/ManageOpportunities';
import ManageApplications from './pages/charity/ManageApplications';

// Moderator Pages
import ModeratorDashboard from './pages/moderator/Dashboard';
import ModeratorManagement from './pages/moderator/ModeratorManagement';
// CharityOpportunities page removed; charity opportunities are shown inline in moderator management
import ModeratorOpportunities from './pages/moderator/ModeratorOpportunities';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated && user) {
    // Redirect to role-specific dashboard
    const dashboards = {
      volunteer: '/volunteer/dashboard',
      charity: '/charity/dashboard',
      moderator: '/moderator/dashboard',
    };
    return <Navigate to={dashboards[user.role] || '/'} replace />;
  }

  return children;
};

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route
            path="login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="register-charity"
            element={
              <PublicRoute>
                <RegisterCharity />
              </PublicRoute>
            }
          />
          <Route
            path="register-volunteer"
            element={
              <PublicRoute>
                <RegisterVolunteer />
              </PublicRoute>
            }
          />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />

          {/* Opportunities */}
          <Route path="opportunities" element={<OpportunityList />} />
          <Route path="opportunities/:id" element={<OpportunityDetail />} />

          {/* Volunteer Routes */}
          <Route
            path="volunteer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="volunteer/profile"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <VolunteerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="volunteer/applications"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="volunteer/attendance"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <AttendanceHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="volunteer/application-workflow/:id"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <ApplicationWorkflow />
              </ProtectedRoute>
            }
          />

          {/* Charity Routes */}
          <Route
            path="charity/dashboard"
            element={
              <ProtectedRoute allowedRoles={['charity']}>
                <CharityDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="charity/profile"
            element={
              <ProtectedRoute allowedRoles={['charity']}>
                <CharityProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="charity/opportunities/create"
            element={
              <ProtectedRoute allowedRoles={['charity']}>
                <CreateOpportunity />
              </ProtectedRoute>
            }
          />
          <Route
            path="charity/opportunities/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['charity']}>
                <EditOpportunity />
              </ProtectedRoute>
            }
          />
          <Route
            path="charity/opportunities"
            element={
              <ProtectedRoute allowedRoles={['charity']}>
                <ManageOpportunities />
              </ProtectedRoute>
            }
          />
          <Route
            path="charity/applications"
            element={
              <ProtectedRoute allowedRoles={['charity']}>
                <ManageApplications />
              </ProtectedRoute>
            }
          />

          {/* Moderator Routes */}
          <Route
            path="moderator/dashboard"
            element={
              <ProtectedRoute allowedRoles={['moderator']}>
                <ModeratorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="moderator/management"
            element={
              <ProtectedRoute allowedRoles={['moderator']}>
                <ModeratorManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="moderator/opportunities"
            element={
              <ProtectedRoute allowedRoles={['moderator']}>
                <ModeratorOpportunities />
              </ProtectedRoute>
            }
          />
          <Route
            path="moderator/charities/:charityId/opportunities"
            element={
              <ProtectedRoute allowedRoles={['moderator']}>
                {/* Charity opportunities moved inline into ModeratorManagement */}
              </ProtectedRoute>
            }
          />
          

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
