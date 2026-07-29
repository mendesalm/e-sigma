import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface RotaPrivadaProps {
  children: React.ReactNode;
  allowedRoles?: ('super_admin' | 'webmaster' | 'member')[];
}

export const RotaPrivada: React.FC<RotaPrivadaProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (user === undefined) {
    // Context is still initializing (if we had a loading state, we'd check it here)
    return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  }

  if (!user) {
    // Not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but insufficient permissions
    // Redirect to root or a specific dashboard based on what they *are* allowed to see
    if (user.role === 'super_admin') return <Navigate to="/global" replace />;
    if (user.role === 'webmaster') return <Navigate to="/central" replace />; // or local
    return <Navigate to="/local" replace />;
  }

  return <>{children}</>;
};
