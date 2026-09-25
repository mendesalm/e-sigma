import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

type CustomThemeContextType = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

const CustomThemeContext = createContext<CustomThemeContextType>({
  mode: 'dark',
  toggleColorMode: () => {},
});

export const useCustomTheme = () => useContext(CustomThemeContext);

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as PaletteMode) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo<Theme>(() => {
    return createTheme({
      palette: {
        mode,
        primary: {
          main: mode === 'dark' ? '#38bdf8' : '#0369a1', // Neon cyan / Dark sky blue
          light: mode === 'dark' ? '#7dd3fc' : '#0284c7',
          dark: mode === 'dark' ? '#0284c7' : '#075985',
          contrastText: mode === 'dark' ? '#082f49' : '#ffffff',
        },
        secondary: {
          main: mode === 'dark' ? '#94a3b8' : '#475569', // Carbono grey
          light: '#cbd5e1',
          dark: '#334155',
          contrastText: '#ffffff',
        },
        background: {
          default: mode === 'dark' ? '#0B0F19' : '#f8fafc',
          paper: mode === 'dark' ? '#131b29' : '#ffffff',
        },
        text: {
          primary: mode === 'dark' ? '#f1f5f9' : '#0f172a',
          secondary: mode === 'dark' ? '#94a3b8' : '#475569',
        },
        divider: mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(3, 105, 161, 0.2)', // Tech cyan divider
      },
      typography: {
        fontFamily: '"Inter", "Tektur", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 600, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#ffffff' : '#0f172a' },
        h2: { fontWeight: 600, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#ffffff' : '#0f172a' },
        h3: { fontWeight: 600, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#ffffff' : '#0f172a' },
        h4: { fontWeight: 600, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#ffffff' : '#0f172a' },
        h5: { fontWeight: 600, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#ffffff' : '#0f172a' },
        h6: { fontWeight: 600, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#ffffff' : '#0f172a' },
        body1: { color: mode === 'dark' ? '#e2e8f0' : '#1e293b' },
        body2: { color: mode === 'dark' ? '#94a3b8' : '#475569' },
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#0B0F19' : '#ffffff',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)'}`,
              color: mode === 'dark' ? '#ffffff' : '#0f172a',
              boxShadow: mode === 'dark' ? '0 4px 20px rgba(56, 189, 248, 0.05)' : '0 4px 20px rgba(2, 132, 199, 0.05)',
              borderRadius: 0,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: mode === 'dark' ? '#0B0F19' : '#ffffff',
              borderRight: `1px solid ${mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)'}`,
              borderRadius: 0,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 4, // Tech style boxy buttons
              textTransform: 'uppercase',
              fontWeight: 600,
              fontFamily: '"Tektur", sans-serif',
              letterSpacing: '0.5px'
            },
            containedPrimary: {
              background: mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(8, 47, 73, 0.8) 0%, rgba(3, 105, 161, 0.4) 100%)' 
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: mode === 'dark' ? '#e0f2fe' : '#ffffff',
              border: mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.5)' : 'none',
              boxShadow: mode === 'dark' ? '0 0 10px rgba(56, 189, 248, 0.2)' : '0 2px 8px rgba(2, 132, 199, 0.3)',
              '&:hover': {
                background: mode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(8, 47, 73, 1) 0%, rgba(3, 105, 161, 0.6) 100%)' 
                  : 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
                borderColor: '#38bdf8',
                boxShadow: mode === 'dark' ? '0 0 15px rgba(56, 189, 248, 0.4)' : '0 4px 12px rgba(2, 132, 199, 0.4)',
              },
            },
            containedSecondary: {
              background: mode === 'dark' ? '#131b29' : '#ffffff',
              color: mode === 'dark' ? '#f1f5f9' : '#0284c7',
              border: `1px solid ${mode === 'dark' ? '#94a3b8' : '#0284c7'}`,
              '&:hover': {
                background: mode === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(2, 132, 199, 0.1)',
              },
            },
            outlined: {
              borderColor: mode === 'dark' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.4)',
              color: mode === 'dark' ? '#38bdf8' : '#0284c7',
              '&:hover': {
                borderColor: mode === 'dark' ? '#38bdf8' : '#0284c7',
                backgroundColor: mode === 'dark' ? 'rgba(56, 189, 248, 0.05)' : 'rgba(2, 132, 199, 0.05)',
                boxShadow: mode === 'dark' ? '0 0 8px rgba(56, 189, 248, 0.2)' : 'none',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? '#131b29' : '#ffffff',
              borderRadius: 8,
              border: `1px solid ${mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)'}`,
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? '#131b29' : '#ffffff',
              borderRadius: 8,
              border: `1px solid ${mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)'}`,
              boxShadow: mode === 'dark' ? '0 4px 20px rgba(56, 189, 248, 0.03)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            head: {
              fontWeight: 600,
              color: mode === 'dark' ? '#38bdf8' : '#0369a1',
              backgroundColor: mode === 'dark' ? '#131b29' : '#f8fafc',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)'}`,
            },
            body: {
              color: mode === 'dark' ? '#f1f5f9' : '#0f172a',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)'}`,
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
                backgroundColor: mode === 'dark' ? '#0B0F19' : '#ffffff',
                color: mode === 'dark' ? '#ffffff' : '#0f172a',
                '& fieldset': {
                  borderColor: mode === 'dark' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? '#38bdf8' : '#0284c7',
                },
                '&.Mui-focused fieldset': {
                  borderColor: mode === 'dark' ? '#7dd3fc' : '#0369a1',
                },
              },
              '& .MuiInputLabel-root': {
                color: mode === 'dark' ? '#94a3b8' : '#475569',
                '&.Mui-focused': {
                  color: mode === 'dark' ? '#7dd3fc' : '#0369a1',
                },
              },
            },
          },
        },
        MuiSelect: {
          defaultProps: {
            size: 'small',
            variant: 'outlined',
            fullWidth: true,
          },
        },
        MuiFormControl: {
          defaultProps: {
            size: 'small',
            variant: 'outlined',
            fullWidth: true,
          },
        },
        MuiInputLabel: {
          defaultProps: {
            size: 'small',
          },
          styleOverrides: {
            root: {
              color: mode === 'dark' ? '#94a3b8' : '#475569',
              '&.Mui-focused': {
                color: mode === 'dark' ? '#7dd3fc' : '#0369a1',
              },
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              '&.Mui-selected': {
                backgroundColor: mode === 'dark' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                borderLeft: `4px solid ${mode === 'dark' ? '#38bdf8' : '#0284c7'}`,
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                },
              },
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <CustomThemeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CustomThemeContext.Provider>
  );
};
