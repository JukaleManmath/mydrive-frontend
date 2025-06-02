import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://mydrive-backend-oi3r.onrender.com';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Set up axios interceptor for token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Handle token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Response interceptor error:', error);
        if (error.response?.status === 401) {
          console.log('Token expired or invalid, logging out');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Fetch user data when token changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        console.log('No token found, clearing user data');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching user data with token:', token);
        const response = await axios.get(`${API_URL}/users/me`);
        console.log('Fetched user data:', response.data);
        
        if (!response.data) {
          console.error('No user data received');
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          setToken(null);
          return;
        }

        // Extract user data and ensure username is present
        const userData = response.data;
        if (!userData.username && userData.email) {
          // If username is not present but email is, use email as username
          userData.username = userData.email.split('@')[0];
        }

        console.log('Setting user data:', userData);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  const login = async (username, password) => {
    try {
      console.log('Attempting login for username:', username);
      // Create form data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post(`${API_URL}/token`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (!response.data || !response.data.access_token) {
        console.error('No access token in response:', response.data);
        throw new Error('Invalid response from server');
      }

      const { access_token } = response.data;
      console.log('Login successful, received token');
      localStorage.setItem('token', access_token);
      setToken(access_token);

      // Fetch user data immediately after login
      try {
        console.log('Fetching user data after login');
        const userResponse = await axios.get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        console.log('Raw user data after login:', userResponse.data);
        
        // Check if we have a valid user object
        if (!userResponse.data) {
          console.error('No user data received');
          throw new Error('No user data received');
        }

        // Log all available fields in the user data
        console.log('User data fields:', Object.keys(userResponse.data));
        
        // Extract user data and ensure username is present
        const userData = userResponse.data;
        if (!userData.username && userData.email) {
          // If username is not present but email is, use email as username
          userData.username = userData.email.split('@')[0];
        }
        
        console.log('Processed user data:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } catch (error) {
        console.error('Error fetching user data after login:', error);
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
        }
        // Clean up on error
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        throw error;
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      // Clean up on error
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      await axios.post(`${API_URL}/register`, {
        username,
        email,
        password,
      });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 