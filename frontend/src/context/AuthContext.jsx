import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api'; // Import our new api client

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Use the new client, the URL is now relative
        const { data } = await apiClient.get('/api/me');
        setUser(data);
      } catch (error) {
        console.log('No user logged in.');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};