import { createTheme } from '@mui/material/styles';

/**
 * Tema Global da Aplicação Sigma 2.0.
 * Resgata a paleta de cores "Dark Navy" e "Bright Cyan" consagrada na V1.
 */
const temaMui = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00B0FF', // Ciano Brilhante (Cor Primária)
      light: '#33BFFF',
      dark: '#007BB2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057', // Rosa/Vermelho para ações destrutivas ou de destaque
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0b111b', // Azul Marinho Profundo (Fundo principal)
      paper: '#131b29', // Fundo dos cards e painéis
    },
    text: {
      primary: '#e0e0e0', // Cinza claro (Texto Principal)
      secondary: '#a0a0a0', // Cinza mudo (Texto Secundário)
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600, color: '#e0e0e0' },
    h2: { fontWeight: 600, color: '#e0e0e0' },
    h3: { fontWeight: 600, color: '#e0e0e0' },
    h4: { fontWeight: 600, color: '#e0e0e0' },
    h5: { fontWeight: 600, color: '#e0e0e0' },
    h6: { fontWeight: 600, color: '#e0e0e0' },
    body1: { color: '#e0e0e0' },
    body2: { color: '#a0a0a0' },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0b111b',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0b111b',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
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
