import React, { useEffect }            from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth }                      from '../hooks/useAuth';

const AuthSuccessPage: React.FC = () => {
  const [qs]     = useSearchParams();
  const navigate = useNavigate();
  const { login }= useAuth();

  useEffect(() => {
    const token = qs.get('token');
    if (!token) {
      navigate('/signup', { replace: true });
      return;
    }
  
    // define an async function inside the effect
    const doLogin = async () => {
      try {
        const user = await login(token);
        if (!user) {
          navigate('/', { replace: true });
        } else if (!user.profileComplete) {
          navigate('/completeProfile', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch {
        navigate('/signup', { replace: true });
      }
    };
  
    // call it (but don’t return it)
    doLogin();
  }, [qs, login, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      Signing you in…
    </div>
  );
};

export default AuthSuccessPage;