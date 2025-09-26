import React, { useState } from 'react';
import { Box, Drawer, useTheme, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DRAWER_WIDTH = 280;

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* TopBar */}
      <TopBar onMenuClick={handleDrawerToggle} />

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ 
          width: { lg: DRAWER_WIDTH }, 
          flexShrink: { lg: 0 } 
        }}
      >
          {isMobile ? (
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true // Melhor performance em mobile
              }}
              sx={{
                '& .MuiDrawer-paper': { 
                  boxSizing: 'border-box', 
                  width: DRAWER_WIDTH,
                  borderRight: `1px solid ${theme.palette.divider}`,
                  background: theme.palette.background.paper
                }
              }}
            >
              <Sidebar onItemClick={() => setMobileOpen(false)} />
            </Drawer>
          ) : (
            <Drawer
              variant="permanent"
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: DRAWER_WIDTH,
                  borderRight: `1px solid ${theme.palette.divider}`,
                  background: theme.palette.background.paper
                }
              }}
              open
            >
              <Sidebar />
            </Drawer>
          )}
        </Box>

        {/* Conteúdo Principal */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Espaço para TopBar */}
          <Box sx={{ height: 64 }} />
          
          {/* Conteúdo da página */}
          <Box
            sx={{
              flexGrow: 1,
              p: 3,
              backgroundColor: theme.palette.grey[50],
              overflow: 'auto'
            }}
          >
            {children || <Outlet />}
          </Box>
        </Box>
      </Box>
  );
};

export default Layout;