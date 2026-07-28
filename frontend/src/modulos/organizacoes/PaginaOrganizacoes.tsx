import React from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';

/**
 * Página Base do Módulo de Organizações.
 * Utilizada para testes estruturais do Roteador e do Tema.
 */
export const PaginaOrganizacoes: React.FC = () => {
  return (
    <Box p={4}>
      <Typography variant="h3" color="primary" gutterBottom>
        Módulo de Organizações
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Esta é a página embrionária da fatia vertical de Lojas e Obediências.
            Se você está vendo esta tela e o fundo é azul marinho, o Tema e o Roteador estão funcionando!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
