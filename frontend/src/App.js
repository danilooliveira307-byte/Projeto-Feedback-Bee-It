import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './hooks/use-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Feedbacks from './pages/Feedbacks';
import FeedbackForm from './pages/FeedbackForm';
import FeedbackDetail from './pages/FeedbackDetail';
import ActionPlans from './pages/ActionPlans';
import ActionPlanDetail from './pages/ActionPlanDetail';
import CollaboratorProfile from './pages/CollaboratorProfile';
import Users from './pages/Users';
import Teams from './pages/Teams';
import Collaborators from './pages/Collaborators';

// Components
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(30,94%,54%)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.papel)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(30,94%,54%)]"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes - All Users */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedbacks"
        element={
          <ProtectedRoute>
            <Feedbacks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedbacks/:id"
        element={
          <ProtectedRoute>
            <FeedbackDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/planos-acao"
        element={
          <ProtectedRoute>
            <ActionPlans />
          </ProtectedRoute>
        }
      />
      <Route
        path="/planos-acao/:id"
        element={
          <ProtectedRoute>
            <ActionPlanDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil/:id"
        element={
          <ProtectedRoute>
            <CollaboratorProfile />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Gestor & Admin */}
      <Route
        path="/feedbacks/novo"
        element={
          <ProtectedRoute requiredRoles={['ADMIN', 'GESTOR']}>
            <FeedbackForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedbacks/:id/editar"
        element={
          <ProtectedRoute requiredRoles={['ADMIN', 'GESTOR']}>
            <FeedbackForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/colaboradores"
        element={
          <ProtectedRoute requiredRoles={['ADMIN', 'GESTOR']}>
            <Collaborators />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Admin Only */}
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute requiredRoles={['ADMIN']}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/times"
        element={
          <ProtectedRoute requiredRoles={['ADMIN']}>
            <Teams />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
