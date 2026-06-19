import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store';
import { AgeGate } from './AgeGate';
import { LoadingOverlay } from './LoadingOverlay';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = true }) => {
  const { ageVerified, setAgeVerified, user, isLoading, authChecked } = useStore();

  if (!ageVerified) {
    return <AgeGate onVerify={() => setAgeVerified(true)} />;
  }

  if (requireAuth) {
    if (isLoading || !authChecked) {
      return <LoadingOverlay />;
    }
    if (!user?.is_authenticated) {
      return <Navigate to="/auth" replace />;
    }
  }

  return <>{children}</>;
};
