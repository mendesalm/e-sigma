import React from 'react';
import { Box, Typography } from '@mui/material';

export const DashboardGlobal: React.FC = () => {
  return (
    <Box p={4}>
      <Typography variant="h3" color="secondary">Painel Sistêmico (SuperAdmin)</Typography>
      <Typography variant="body1">Gestão de Assinaturas, Tenants (Obediências) e Engine ERP Comercial.</Typography>
    </Box>
  );
};
