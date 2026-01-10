import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="w-full py-8">
      <div className="mx-auto w-full max-w-[var(--page-content-max)] [--page-content-max:48rem] px-0 sm:px-4">
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
          <p className="text-gray-400">The page you are looking for does not exist.</p>
          <Link
            to="/"
            className="px-4 py-2 bg-purple-600 text-white visited:text-white hover:text-white rounded no-underline hover:bg-purple-500"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
