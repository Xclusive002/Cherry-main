import React from 'react';
import { useStore } from '../store';
import { AgeGate } from './AgeGate';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { ageVerified, setAgeVerified } = useStore();

  if (!ageVerified) {
    return <AgeGate onVerify={() => setAgeVerified(true)} />;
  }

  return <>{children}</>;
};
