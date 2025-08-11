import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RequireAdmin: React.FC = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/signup" replace />;
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default RequireAdmin;
