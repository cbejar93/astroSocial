// src/components/RequireProfileCompletion.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth }                       from "../../hooks/useAuth";

export const RequireProfileCompletion: React.FC = () => {
  const { user } = useAuth();
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
      return <Navigate to="/" replace />;
    }
    // else: logged in but not complete → allow
  }

  // redirect users with incomplete profiles to complete their profile
  if (pathname !== "/completeProfile" && user && !user.profileComplete) {
    return <Navigate to="/completeProfile" replace />;
  }

  // send unauthenticated users trying to upload to sign in
  if (pathname === "/upload" && !user) {
    return <Navigate to="/signup" replace />;
  }

  // redirect unauthenticated users away from lounge post creation
  if (/^\/lounge\/[^/]+\/post$/.test(pathname) && !user) {
    return <Navigate to="/signup" replace />;
  }

  // any other route, just render the child routes
  return <Outlet />;
};
