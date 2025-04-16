
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminRouteGuardProps {
  children: ReactNode;
}

const AdminRouteGuard = ({ children }: AdminRouteGuardProps) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';

  // Check authentication status
  if (!isAuthenticated) {
    // Redirect to the admin login page if not authenticated
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
