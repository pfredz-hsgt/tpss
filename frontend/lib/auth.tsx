'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, LoginRequest, RegisterRequest, ChangePasswordRequest } from './api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and validate
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData as User);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user as User);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const register = async (data: RegisterRequest) => {
    await authApi.register(data);
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    await authApi.changePassword(data);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === UserRole.ADMIN,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

