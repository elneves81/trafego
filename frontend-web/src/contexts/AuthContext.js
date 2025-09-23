import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Configurar token no cabeçalho das requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verificar se o token é válido
      api.get('/auth/me')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(error => {
          console.error('Erro ao verificar token:', error);
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials) => {
    try {
      const response = await axios.post('http://10.0.50.79:8089/api/auth/login', credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // A resposta tem estrutura: { success: true, data: { user, token } }
      const { token: newToken, user: userData } = response.data.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao atualizar perfil' 
      };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await api.put('/auth/change-password', passwordData);
      return { success: true };
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao alterar senha' 
      };
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin tem todas as permissões
    if (user.role === 'admin') return true;
    
    // Supervisor tem permissões específicas
    if (user.role === 'supervisor') {
      const supervisorPermissions = [
        'view_dashboard',
        'manage_rides',
        'view_vehicles',
        'view_drivers',
        'view_map',
        'view_reports'
      ];
      return supervisorPermissions.includes(permission);
    }
    
    // Operador tem permissões básicas
    if (user.role === 'operator') {
      const operatorPermissions = [
        'view_dashboard',
        'manage_rides',
        'view_vehicles',
        'view_map'
      ];
      return operatorPermissions.includes(permission);
    }
    
    return false;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    hasPermission,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
    isOperator: user?.role === 'operator'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};