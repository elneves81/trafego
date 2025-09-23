import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DashboardAdminPage from './pages/DashboardAdminPage';
import DashboardOperatorPage from './pages/DashboardOperatorPage';
import DashboardDriverPage from './pages/DashboardDriverPage';
import RidesPage from './pages/RidesPage';
import VehiclesPage from './pages/VehiclesPage';
import DriversPage from './pages/DriversPage';
import MapPage from './pages/MapPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import LoadingSpinner from './components/Common/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <LoadingSpinner size={60} />
      </Box>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Função para determinar qual dashboard mostrar baseado no tipo de usuário
  const getDashboardComponent = () => {
    switch (user.userType) {
      case 'admin':
        return <DashboardAdminPage />;
      case 'operator':
      case 'supervisor':
        return <DashboardOperatorPage />; // Dashboard específico para operadores/atendentes
      case 'driver':
        return <DashboardDriverPage />; // Dashboard específico para motoristas
      default:
        return <DashboardAdminPage />;
    }
  };

  // Verificar permissões baseadas no tipo de usuário
  const hasAccess = (requiredRoles) => {
    if (!user || !requiredRoles) return false;
    return requiredRoles.includes(user.userType);
  };

  return (
    <SocketProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={getDashboardComponent()} />
          
          {/* Rotas para Admin */}
          {hasAccess(['admin']) && (
            <>
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </>
          )}
          
          {/* Rotas para Admin e Operadores */}
          {hasAccess(['admin', 'operator', 'supervisor']) && (
            <>
              <Route path="/rides" element={<RidesPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </>
          )}
          
          {/* Rotas acessíveis por todos */}
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Redirecionar rotas não autorizadas */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </SocketProvider>
  );
}

export default App;