import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authService.getMe();
          const userData = response.data?.user || response.user || response.data;
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed', error);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    const token = response.data?.accessToken || response.accessToken;
    const userData = response.data?.user || response.user;
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
    return response;
  };

  const register = async (name, email, password) => {
    const response = await authService.register({ name, email, password });
    const token = response.data?.accessToken || response.accessToken;
    const userData = response.data?.user || response.user;
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const handleOAuthToken = async (token) => {
    localStorage.setItem('token', token);
    try {
      const response = await authService.getMe();
      const userData = response.data?.user || response.user || response.data;
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, handleOAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
