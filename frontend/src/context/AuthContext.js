import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
await api.post("/auth/register", payload);

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
    console.log("Calling login API...");

    const res = await api.post('/auth/login', {
      email,
      password
    });

    console.log("Login Response:", res.data);

    localStorage.setItem('mailwave_token', res.data.token);
    localStorage.setItem('mailwave_user', JSON.stringify(res.data.user));

    setUser(res.data.user);

    return res.data;
  };

  const register = async (name, email, password) => {
  const response = await fetch(
    "http://localhost:5000/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  localStorage.setItem("mailwave_token", data.token);
  localStorage.setItem(
    "mailwave_user",
    JSON.stringify(data.user)
  );

  setUser(data.user);

  return data;
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
