import React from 'react';
import { Box, Typography, TextField, Button, Card, CardContent } from '@mui/material';

export const PaginaLogin: React.FC = () => {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Typography variant="h4" color="primary" gutterBottom align="center">Acesso ao Sistema</Typography>
          <TextField label="Email ou CIM" fullWidth margin="normal" />
          <TextField label="Senha" type="password" fullWidth margin="normal" />
          <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Entrar
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};
