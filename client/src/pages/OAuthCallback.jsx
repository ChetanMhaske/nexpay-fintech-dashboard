import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleOAuthToken } = useAuth();

  useEffect(() => {
    const processToken = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      
      if (token) {
        try {
          await handleOAuthToken(token);
          navigate('/dashboard');
        } catch (error) {
          navigate('/login?error=auth_failed');
        }
      } else {
        navigate('/login');
      }
    };
    
    processToken();
  }, [location, handleOAuthToken, navigate]);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center">
      <Spinner size="lg" />
      <p className="mt-4 text-dark-300">Completing sign in...</p>
    </div>
  );
};

export default OAuthCallback;
