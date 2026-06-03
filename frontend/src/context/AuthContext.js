import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

// ✅ Line 3 deleted

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mailwave_token');
    const stored = localStorage.getItem('mailwave_user');
    if (token && stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('mailwave_token', res.data.token);
    localStorage.setItem('mailwave_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    // ✅ Use api instead of hardcoded localhost
    const res = await api.post('/auth/register', { name, email, password });

    if (res.status !== 200 && res.status !== 201) {
      throw res.data;
    }

    localStorage.setItem('mailwave_token', res.data.token);
    localStorage.setItem('mailwave_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('mailwave_token');
    localStorage.removeItem('mailwave_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);