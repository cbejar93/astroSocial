// src/components/RequireProfileCompletion.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth }                       from "../../contexts/AuthContext";

export const RequireProfileCompletion: React.FC = () => {
  const { user, loading } = useAuth();
  const { pathname }      = useLocation();

  // while we’re checking auth, don’t render anything
//   if (loading) return null;
  // only protect the completeProfile page
  if (pathname === "/completeProfile") {
    // 1) not logged in → send to signup
    if (!user) {
      return <Navigate to="/signup" replace />;
    }
    // 2) already complete → send to feed
    if (user.profileComplete) {
        console.log('back to feed');
      return <Navigate to="/" replace />;
    }
    // else: logged in but not complete → allow
  }

  // any other route, just render the child routes
  return <Outlet />;
};
