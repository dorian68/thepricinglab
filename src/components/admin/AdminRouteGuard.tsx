
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AdminRouteGuard = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';

  // Check authentication status
  if (!isAuthenticated) {
    // Redirect to the admin login page if not authenticated
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRouteGuard;
