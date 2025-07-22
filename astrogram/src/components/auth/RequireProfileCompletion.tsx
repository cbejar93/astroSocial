import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth }                        from "../../contexts/AuthContext";

export const RequireProfileCompletion: React.FC = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // if they _are_ logged in, but haven't finished profile, and
  // they aren't already on the complete‑profile page:
  if (
    user !== null &&
    !user.profileComplete &&
    pathname !== "/complete-profile"
  ) {
    return <Navigate to="/completeProfile" replace />;
  }

  // otherwise—guests, or fully profiled users—just continue
  return <Outlet />;
};