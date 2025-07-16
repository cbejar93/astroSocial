import React, { useEffect }         from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthSuccessPage: React.FC = () => {
  const [search]  = useSearchParams();
  const navigate  = useNavigate();

  useEffect(() => {
    const token = search.get('token');
    if (token) {
      // 1) Store the JWT
      localStorage.setItem('AUTH_TOKEN', token);

      // 2) (Optional) Set default auth header
      // apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

-     // 3) Redirect into your app’s home
-     navigate('/', { replace: true });
+     // 3) Redirect into your app’s feed
+     navigate('/', { replace: true });
    } else {
      // no token? send them back to signup
      navigate('/signup', { replace: true });
    }
  }, [search, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-700">Signing you in…</p>
    </div>
  );
};

export default AuthSuccessPage;