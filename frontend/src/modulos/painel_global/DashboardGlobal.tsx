import React, { useState } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  AppBar,
  CssBaseline,
  Divider,
  Paper
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StorageIcon from '@mui/icons-material/Storage';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HandshakeIcon from '@mui/icons-material/Handshake';

import { GestaoLojas } from './componentes/GestaoLojas';
import { GestaoObediencias } from './componentes/GestaoObediencias';
import { GestaoAssinaturas } from './componentes/GestaoAssinaturas';
import { GestaoTratados } from './componentes/GestaoTratados';

const drawerWidth = 260;

export const DashboardGlobal: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState(0);

  const menuItems = [
    { text: 'Lojas', icon: <BusinessIcon />, id: 0 },
    { text: 'Obediências', icon: <BusinessIcon />, id: 1 },
    { text: 'Assinaturas (SaaS)', icon: <MonetizationOnIcon />, id: 2 },
    { text: 'Tratados de Amizade', icon: <HandshakeIcon />, id: 3 },
    { text: 'Custos Sistêmicos', icon: <StorageIcon />, id: 4 },
    { text: 'Administradores', icon: <AdminPanelSettingsIcon />, id: 5 },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #050f19 0%, #0a2540 100%)' }}>
      <CssBaseline />
      
      {/* Barra de Topo */}
      <AppBar position="fixed" sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1, 
        backgroundColor: 'rgba(30, 30, 47, 0.6)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'none'
      }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: '#00E5FF', fontWeight: 'bold', letterSpacing: 1 }}>
            Sigma 2.0 <Typography component="span" sx={{ color: 'rgba(255,255,255,0.5)' }}>| Painel Sistêmico Global</Typography>
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(0,0,0,0.2)', px: 2, py: 0.5, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
            sistema@e-sigma.app
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Menu Lateral (Drawer) */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box', 
            backgroundColor: 'rgba(40, 41, 61, 0.4)', 
            backdropFilter: 'blur(15px)',
            color: 'white',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2, px: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton 
                  selected={abaAtiva === item.id}
                  onClick={() => setAbaAtiva(item.id)}
                  sx={{
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(0, 229, 255, 0.15)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(0, 229, 255, 0.3)'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: abaAtiva === item.id ? '#00E5FF' : 'rgba(255,255,255,0.6)', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: abaAtiva === item.id ? 600 : 400,
                          color: abaAtiva === item.id ? '#00E5FF' : 'rgba(255,255,255,0.8)'
                        }
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Área Principal de Conteúdo */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
        <Toolbar />
        
        {abaAtiva === 0 && (
          <GestaoLojas />
        )}

        {abaAtiva === 1 && (
          <GestaoObediencias />
        )}

        {abaAtiva === 2 && (
          <GestaoAssinaturas />
        )}

        {abaAtiva === 3 && (
          <GestaoTratados />
        )}

        {abaAtiva === 4 && (
          <Paper sx={{ p: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#00E5FF', fontWeight: 'bold' }}>
              Custos Sistêmicos (Infraestrutura)
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Lançamento de despesas vinculadas à Organização Raiz (Sigma Core), como VPN, AWS, Disparo de Emails, etc.
            </Typography>
          </Paper>
        )}

        {abaAtiva === 5 && (
          <Paper sx={{ p: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#00E5FF', fontWeight: 'bold' }}>
              Gestão de Administradores
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Criação de novos usuários com nível SuperAdmin para a equipe técnica e suporte.
            </Typography>
          </Paper>
        )}

      </Box>
    </Box>
  );
};
