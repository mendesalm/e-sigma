import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import addexLogo from '../../assets/icons/Addex_Logo2.png';

const Rodape: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#0B132B',
        scrollSnapAlign: 'start', // Enable scroll snapping to the start
        scrollSnapStop: 'always', // Always snap to this element
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          &copy; {new Date().getFullYear()} SIGMA. Todos os direitos reservados.
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Contato: suporte@sigma.com.br
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Desenvolvido por Addex Software Development -{' '}
          <a href="http://www.addex.dev" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            www.addex.dev
          </a>
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Box 
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.85)', 
              p: 1.5, 
              borderRadius: 2, 
              display: 'inline-flex',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(5px)'
            }}
          >
            <Box 
              component="img" 
              src={addexLogo} 
              alt="Addex Software Development Logo" 
              sx={{ height: '2cm', objectFit: 'contain' }} 
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Rodape;
