import React from 'react';
// import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaGoogle } from "react-icons/fa";


const SignupPage: React.FC = () => {
  const base = import.meta.env.VITE_API_BASE_URL || '/api';

  const handleGoogleSignIn = () => {
    // Redirect to NestJS Google OAuth start
    window.location.href = `${base}/auth/google`;
  };

  const handleFacebookSignIn = () => {
    window.location.href = `${base}/auth/facebook`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 lg:items-start lg:pt-16">
      <div className="max-w-sm w-full p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h1 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100">
          Sign Up
        </h1>
        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          className="relative w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <FaGoogle className="absolute left-6 w-6 h-6" />
          <span className="w-full text-center text-gray-800 dark:text-gray-100 font-medium">
            Continue with Google
          </span>
        </button>
        {/* Facebook */}
        <button
          onClick={handleFacebookSignIn}
          className="relative w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <FaFacebook className="absolute left-6 w-6 h-6" />
          <span className="w-full text-center text-gray-800 dark:text-gray-100 font-medium">
            Continue with Facebook
          </span>
        </button>
      </div>
    </div>
  );
};

export default SignupPage;
