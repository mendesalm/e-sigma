import React from 'react';
import { Box, Typography } from '@mui/material';

export const DashboardLocal: React.FC = () => {
  return (
    <Box p={4}>
      <Typography variant="h3" color="primary">Painel da Loja</Typography>
      <Typography variant="body1">Acesso unificado: Veneráveis, Secretários e Obreiros Comuns. As funções visíveis dependem da credencial do usuário.</Typography>
    </Box>
  );
};
