
import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';

interface AdminRouteGuardProps {
  children: ReactNode;
}

const AdminRouteGuard = ({ children }: AdminRouteGuardProps) => {
  const location = useLocation();
  const { user, profile, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (!isLoading && user && profile) {
      // Check if user has admin role in database
      setIsAdmin(profile.role === 'admin');
      setIsCheckingAdmin(false);
    } else if (!isLoading && !user) {
      setIsCheckingAdmin(false);
    }
  }, [user, profile, isLoading]);

  // Show loading while checking auth state
  if (isLoading || isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-accent"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-finance-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="bg-red-500/20 border-red-500">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-500">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Accès non autorisé</span>
              </div>
              <p>Vous devez avoir les privilèges d'administrateur pour accéder à cette page.</p>
              <p className="mt-2 text-sm">Contactez l'administrateur du système si vous pensez qu'il s'agit d'une erreur.</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
