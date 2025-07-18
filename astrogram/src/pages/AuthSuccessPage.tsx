import React, { useEffect }            from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth }                      from '../contexts/AuthContext';

const AuthSuccessPage: React.FC = () => {
  const [qs]     = useSearchParams();
  const navigate = useNavigate();
  const { login }= useAuth();

  useEffect(() => {
    const token = qs.get('token');
    if (token) {
      login(token)
        .then(() => navigate('/', { replace: true }))
        .catch(() => navigate('/signup', { replace: true }));
    } else {
      navigate('/signup', { replace: true });
    }
  }, [qs, login, navigate]);

  return <div className="flex items-center justify-center h-screen">Signing you in…</div>;
};

export default AuthSuccessPage;