import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await API.get('/auth/me');
        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.log('Chưa đăng nhập');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const { data } = await API.post('/auth/login', { email, password, rememberMe });
      if (data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.message, errorCode: data.errorCode };
    } catch (error) {
      const errData = error.response?.data;
      return {
        success: false,
        error: errData?.message || 'Đăng nhập thất bại',
        errorCode: errData?.errorCode || null
      };
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      const { data } = await API.post('/auth/google', { credential });
      if (data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (error) {
      const errData = error.response?.data;
      return {
        success: false,
        error: errData?.message || 'Đăng nhập Google thất bại'
      };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const { data } = await API.post('/auth/register', { name, email, password, phone });
      if (data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (error) {
      return { success: false, error: 'Đăng ký thất bại' };
    }
  };

  const logout = async () => {
    await API.post('/auth/logout');
    setUser(null);
  };

  const updateUser = (data) => {
    setUser({ ...user, ...data });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};