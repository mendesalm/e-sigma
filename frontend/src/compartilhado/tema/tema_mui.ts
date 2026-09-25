import { createTheme } from '@mui/material/styles';

/**
 * Tema Global da Aplicação Sigma 2.0.
 * Resgata a paleta de cores "Dark Navy" e "Bright Cyan" consagrada na V1.
 */
const temaMui = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#DDB96B', // Ouro Maçônico Canônico
      light: '#FDE68A',
      dark: '#B8862D',
      contrastText: '#070B12',
    },
    secondary: {
      main: '#FDE68A',
      light: '#FFF3C4',
      dark: '#B8862D',
      contrastText: '#070B12',
    },
    background: {
      default: '#050508', // Fundo Preto Abissal
      paper: '#0d1b35', // Deep Blue
    },
    text: {
      primary: '#ffffff', // Branco Puro
      secondary: '#CBD5E1', // Branco Gelo
    },
    divider: 'rgba(221, 185, 107, 0.2)',
  },
  typography: {
    fontFamily: '"Inter", "Tektur", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, color: '#FDE68A' },
    h2: { fontWeight: 700, color: '#FDE68A' },
    h3: { fontWeight: 600, color: '#FFFFFF' },
    h4: { fontWeight: 600, color: '#FDE68A' },
    h5: { fontWeight: 600, color: '#FFFFFF' },
    h6: { fontWeight: 600, color: '#DDB96B' },
    body1: { color: '#ffffff' },
    body2: { color: '#CBD5E1' },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#070e1c',
          borderBottom: '1px solid rgba(221, 185, 107, 0.2)',
          boxShadow: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#070e1c',
          borderRight: '1px solid rgba(221, 185, 107, 0.2)',
          borderRadius: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          background: '#1e293b',
          color: '#e0e0e0',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            background: '#334155',
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
        },
        containedSecondary: {
          background: '#334155',
          color: '#e0e0e0',
          '&:hover': {
            background: '#475569',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          color: '#e0e0e0',
          '&:hover': {
            borderColor: '#e0e0e0',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#131b29',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#131b29',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#0d1218',
            color: '#e0e0e0',
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
            '&.Mui-focused fieldset': { borderColor: '#33BFFF' },
          },
          '& .MuiInputLabel-root': {
            color: '#a0a0a0',
            '&.Mui-focused': { color: '#33BFFF' },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderLeft: '4px solid #e0e0e0',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
          },
        },
      },
    },
  },
});

export default temaMui;
