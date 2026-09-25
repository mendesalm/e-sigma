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
          main: mode === 'dark' ? '#DDB96B' : '#0284c7', // Ouro Maçônico Canônico
          light: mode === 'dark' ? '#FDE68A' : '#38bdf8',
          dark: mode === 'dark' ? '#B8862D' : '#0369a1',
          contrastText: mode === 'dark' ? '#070B12' : '#ffffff',
        },
        secondary: {
          main: mode === 'dark' ? '#FDE68A' : '#475569', // Ouro claro
          light: '#FFF3C4',
          dark: '#B8862D',
          contrastText: '#070B12',
        },
        background: {
          default: mode === 'dark' ? '#050508' : '#f8fafc', // Fundo Preto Abissal
          paper: mode === 'dark' ? '#0d1b35' : '#ffffff', // Deep Blue
        },
        text: {
          primary: mode === 'dark' ? '#ffffff' : '#0f172a', // Branco puro
          secondary: mode === 'dark' ? '#CBD5E1' : '#475569', // Branco gelo
        },
        divider: mode === 'dark' ? 'rgba(221, 185, 107, 0.2)' : 'rgba(3, 105, 161, 0.15)', // Borda dourada sutil
      },
      typography: {
        fontFamily: '"Inter", "Tektur", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#FDE68A' : '#0f172a' },
        h2: { fontWeight: 700, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#FDE68A' : '#0f172a' },
        h3: { fontWeight: 600, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#FFFFFF' : '#0f172a' },
        h4: { fontWeight: 600, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#FDE68A' : '#0f172a' },
        h5: { fontWeight: 600, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#FFFFFF' : '#0f172a' },
        h6: { fontWeight: 600, fontFamily: '"Tektur", sans-serif', color: mode === 'dark' ? '#DDB96B' : '#0f172a' },
        body1: { color: mode === 'dark' ? '#ffffff' : '#1e293b' },
        body2: { color: mode === 'dark' ? '#CBD5E1' : '#475569' },
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#070e1c' : '#ffffff',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(221, 185, 107, 0.2)' : 'rgba(2, 132, 199, 0.15)'}`,
              color: mode === 'dark' ? '#ffffff' : '#0f172a',
              boxShadow: mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.8)' : '0 4px 20px rgba(2, 132, 199, 0.05)',
              borderRadius: 0,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: mode === 'dark' ? '#070e1c' : '#ffffff',
              borderRight: `1px solid ${mode === 'dark' ? 'rgba(221, 185, 107, 0.2)' : 'rgba(2, 132, 199, 0.15)'}`,
              borderRadius: 0,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 9999, // Formato Pill idêntico ao anexo
              textTransform: 'none',
              fontWeight: 600,
              letterSpacing: '0.03em',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            containedPrimary: {
              backgroundImage: mode === 'dark' 
                ? 'linear-gradient(180deg, #163663 0%, #091a33 100%), linear-gradient(180deg, #FDE68A 0%, #DDB96B 50%, #785012 100%)' 
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              backgroundClip: 'padding-box, border-box',
              backgroundOrigin: 'padding-box, border-box',
              border: mode === 'dark' ? '2px solid transparent' : 'none',
              color: '#ffffff',
              boxShadow: mode === 'dark' 
                ? '0 8px 20px -4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(221, 185, 107, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.4)' 
                : '0 2px 8px rgba(2, 132, 199, 0.3)',
              '&:hover': {
                backgroundImage: mode === 'dark' 
                  ? 'linear-gradient(180deg, #1e457d 0%, #0d2345 100%), linear-gradient(180deg, #FFF3C4 0%, #FDE68A 50%, #936214 100%)' 
                  : 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
                boxShadow: mode === 'dark' ? '0 12px 24px -4px rgba(0, 0, 0, 0.9), 0 0 25px rgba(221, 185, 107, 0.45)' : 'none',
                transform: 'translateY(-1.5px)',
              },
            },
            containedSecondary: {
              backgroundImage: mode === 'dark' 
                ? 'linear-gradient(180deg, #222936 0%, #10141c 100%), linear-gradient(180deg, #FDE68A 0%, #DDB96B 50%, #785012 100%)' 
                : '#ffffff',
              backgroundClip: 'padding-box, border-box',
              backgroundOrigin: 'padding-box, border-box',
              border: mode === 'dark' ? '2px solid transparent' : '1px solid #0284c7',
              color: mode === 'dark' ? '#FDE68A' : '#0284c7',
              boxShadow: mode === 'dark' ? '0 8px 20px -4px rgba(0, 0, 0, 0.8), 0 0 12px rgba(221, 185, 107, 0.2)' : 'none',
              '&:hover': {
                color: '#ffffff',
                backgroundImage: mode === 'dark' 
                  ? 'linear-gradient(180deg, #2c3545 0%, #151a24 100%), linear-gradient(180deg, #FFF3C4 0%, #FDE68A 50%, #936214 100%)' 
                  : 'rgba(2, 132, 199, 0.1)',
                boxShadow: mode === 'dark' ? '0 12px 24px -4px rgba(0, 0, 0, 0.9), 0 0 20px rgba(221, 185, 107, 0.35)' : 'none',
                transform: 'translateY(-1.5px)',
              },
            },
            outlined: {
              borderColor: mode === 'dark' ? 'rgba(221, 185, 107, 0.4)' : 'rgba(2, 132, 199, 0.4)',
              color: mode === 'dark' ? '#FDE68A' : '#0284c7',
              '&:hover': {
                borderColor: mode === 'dark' ? '#FDE68A' : '#0284c7',
                backgroundColor: mode === 'dark' ? 'rgba(221, 185, 107, 0.08)' : 'rgba(2, 132, 199, 0.05)',
                boxShadow: mode === 'dark' ? '0 0 12px rgba(221, 185, 107, 0.25)' : 'none',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? 'rgba(14, 28, 54, 0.75)' : '#ffffff',
              backdropFilter: mode === 'dark' ? 'blur(20px) saturate(180%)' : 'none',
              borderRadius: 16,
              border: `1px solid ${mode === 'dark' ? 'rgba(221, 185, 107, 0.22)' : 'rgba(2, 132, 199, 0.15)'}`,
              boxShadow: mode === 'dark' ? '0 16px 40px -10px rgba(0, 0, 0, 0.85), 0 0 25px -5px rgba(14, 28, 54, 0.45)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              backgroundColor: mode === 'dark' ? 'rgba(14, 28, 54, 0.75)' : '#ffffff',
              backdropFilter: mode === 'dark' ? 'blur(20px) saturate(180%)' : 'none',
              borderRadius: 16,
              border: `1px solid ${mode === 'dark' ? 'rgba(221, 185, 107, 0.22)' : 'rgba(2, 132, 199, 0.15)'}`,
              borderTop: `1px solid ${mode === 'dark' ? 'rgba(253, 230, 138, 0.4)' : 'rgba(2, 132, 199, 0.15)'}`,
              boxShadow: mode === 'dark' ? '0 16px 40px -10px rgba(0, 0, 0, 0.85), 0 0 25px -5px rgba(14, 28, 54, 0.45)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            head: {
              fontWeight: 700,
              color: mode === 'dark' ? '#FDE68A' : '#0369a1',
              backgroundColor: mode === 'dark' ? 'rgba(7, 15, 30, 0.95)' : '#f8fafc',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(221, 185, 107, 0.2)' : 'rgba(2, 132, 199, 0.15)'}`,
            },
            body: {
              color: mode === 'dark' ? '#ffffff' : '#0f172a',
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(221, 185, 107, 0.1)' : 'rgba(2, 132, 199, 0.15)'}`,
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
