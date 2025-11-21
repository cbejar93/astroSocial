import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const CompleteProfileGuard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/signup" replace />;
  if (user.profileComplete) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default CompleteProfileGuard;
