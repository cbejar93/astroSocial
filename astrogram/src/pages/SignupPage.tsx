import React from 'react';
import { FcGoogle } from 'react-icons/fc';

const SignupPage: React.FC = () => {
  const handleGoogleSignIn = () => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api';
    // Redirect to NestJS Google OAuth start
    console.log(`${base}/auth/google`)
    window.location.href = `${base}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-sm w-full p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h1 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-100">
          Sign Up
        </h1>
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <FcGoogle className="w-6 h-6" />
          <span className="text-gray-800 dark:text-gray-100 font-medium">
            Sign in with Google
          </span>
        </button>
      </div>
    </div>
  );
};

export default SignupPage;