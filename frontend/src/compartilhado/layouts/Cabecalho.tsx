import React, { useState, useEffect } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  useTheme, 
  Container, 
  alpha, 
  IconButton, 
  Switch,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from "@mui/material";
import { 
  Brightness4, 
  Brightness7, 
  Menu as MenuIcon, 
  Close as CloseIcon, 
  Login as LoginIcon,
  Home as HomeIcon,
  Apps as AppsIcon,
  CardMembership as PlansIcon
} from "@mui/icons-material";
import { useCustomTheme } from '../contextos/ThemeContext';
import { LogoAnimadaSigma } from '../componentes/LogoAnimadaSigma';

export const Cabecalho: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode, toggleColorMode } = useCustomTheme();
  const isLoginPage = location.pathname === "/login";
  const isHomePage = location.pathname === "/";
  
  const [scrolled, setScrolled] = useState(false);
  const [drawerAberto, setDrawerAberto] = useState(false);

  useEffect(() => {
    let customScrollY = 0;

    const updateScroll = () => {
      const currentScroll = location.pathname === '/' ? customScrollY : window.scrollY;
      setScrolled(currentScroll > 50);
    };

    const handleScroll = () => {
      updateScroll();
    };

    const handleCustomScroll = (e: Event) => {
      if ('detail' in e) {
        customScrollY = (e as CustomEvent).detail;
        updateScroll();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('landing-scroll', handleCustomScroll, { passive: true });
    
    updateScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('landing-scroll', handleCustomScroll);
    };
  }, [location.pathname]);

  const scrollToSection = (id: string) => {
    setDrawerAberto(false);
    if (!isHomePage) {
      navigate(`/#${id}`);
      return;
    }
    const container = document.getElementById('landing-container');
    const el = document.getElementById(id);
    if (container && el) {
      container.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' });
    }
  };

  // No mobile, o logo deve ficar sempre visível; no desktop com scroll zero na home ele transiciona
  const hideLogoDesktop = isHomePage && !scrolled;

  return (
    <>
      <AppBar
        position="fixed"
        elevation={scrolled ? 4 : 0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: scrolled 
            ? alpha(theme.palette.background.default, 0.9) 
            : { xs: alpha(theme.palette.background.default, 0.7), md: 'transparent' },
          backdropFilter: "blur(14px)",
          borderBottom: scrolled 
            ? `1px solid ${alpha(theme.palette.divider, 0.15)}` 
            : { xs: `1px solid ${alpha(theme.palette.divider, 0.08)}`, md: 'none' },
          transition: 'all 0.3s ease-in-out',
          backgroundImage: 'none',
          width: '100%',
          top: 0,
          left: 0,
        }}
      >
        <Container maxWidth="xl" disableGutters sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 58, sm: 64, md: 74 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* Logo Section */}
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                opacity: { xs: 1, md: hideLogoDesktop ? 0 : 1 },
                pointerEvents: { xs: 'auto', md: hideLogoDesktop ? 'none' : 'auto' },
                transition: 'opacity 0.4s ease-in-out',
                zIndex: 2,
                flexShrink: 0
              }}
            >
              <RouterLink
                to="/"
                viewTransition
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: '10px',
                }}
              >
                <Box
                  sx={{
                    height: { xs: 34, sm: 38, md: 42 },
                    width: { xs: 34, sm: 38, md: 42 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: theme.palette.mode === 'dark' ? "drop-shadow(0px 0px 8px rgba(56, 189, 248, 0.4))" : "drop-shadow(0px 0px 8px rgba(2, 132, 199, 0.3))",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                    }
                  }}
                >
                  <LogoAnimadaSigma theme="ouro" width="100%" height="100%" showText={false} animated={false} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontFamily: "'Tektur', sans-serif",
                      textTransform: "uppercase",
                      fontWeight: 800, 
                      lineHeight: 1,
                      fontSize: { xs: '1.05rem', sm: '1.2rem', md: '1.25rem' },
                      background: theme.palette.mode === 'dark' ? `linear-gradient(45deg, #FDE68A, #D97706)` : `linear-gradient(45deg, #0F172A, #0284C7)`,
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                      letterSpacing: '-0.02em',
                    }}
                  >
                    SiGMa
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: alpha(theme.palette.text.primary, 0.6),
                      letterSpacing: '0.04em',
                      display: { xs: 'none', sm: 'block' },
                      mt: 0.2,
                      fontSize: '0.62rem',
                      textTransform: 'uppercase'
                    }}
                  >
                    Gestão Maçônica Integrada
                  </Typography>
                </Box>
              </RouterLink>
            </Box>

            {/* Menu Central Desktop (Visível apenas em md+) */}
            <Box 
              sx={{ 
                display: { xs: 'none', md: isHomePage ? 'flex' : 'none' },
                gap: 2.5,
                alignItems: 'center',
                zIndex: 3
              }}
            >
              <Button 
                variant="text" 
                onClick={() => scrollToSection('hero-section')} 
                sx={{ 
                  color: (scrolled || theme.palette.mode === 'light') ? 'text.primary' : 'rgba(255,255,255,0.8)', 
                  '&:hover': { color: 'primary.main' }, 
                  fontFamily: "'Tektur', sans-serif", 
                  fontWeight: 600, 
                  fontSize: '0.85rem',
                  textTransform: 'uppercase' 
                }}
              >
                Início
              </Button>
              <Button 
                variant="text" 
                onClick={() => scrollToSection('modules-section')} 
                sx={{ 
                  color: (scrolled || theme.palette.mode === 'light') ? 'text.primary' : 'rgba(255,255,255,0.8)', 
                  '&:hover': { color: 'primary.main' }, 
                  fontFamily: "'Tektur', sans-serif", 
                  fontWeight: 600, 
                  fontSize: '0.85rem',
                  textTransform: 'uppercase' 
                }}
              >
                Funcionalidades
              </Button>
              <Button 
                variant="text" 
                onClick={() => scrollToSection('planos-section')} 
                sx={{ 
                  color: (scrolled || theme.palette.mode === 'light') ? 'text.primary' : 'rgba(255,255,255,0.8)', 
                  '&:hover': { color: 'primary.main' }, 
                  fontFamily: "'Tektur', sans-serif", 
                  fontWeight: 600, 
                  fontSize: '0.85rem',
                  textTransform: 'uppercase' 
                }}
              >
                Planos
              </Button>
            </Box>

            {/* Seção Direita de Ações (Tema + Login + Menu Mobile) */}
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, alignItems: 'center' }}>
              {/* Alternador de Tema Discreto */}
              <Switch 
                checked={mode === 'dark'} 
                onChange={toggleColorMode} 
                size="small"
                color="primary" 
                icon={<Brightness7 sx={{ fontSize: 14, color: '#f59e0b', m: 0.2 }} />}
                checkedIcon={<Brightness4 sx={{ fontSize: 14, color: '#e0f2fe', m: 0.2 }} />}
                aria-label="Alternar tema"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  '& .MuiSwitch-switchBase': {
                    padding: 0.8,
                    '&.Mui-checked': {
                      transform: 'translateX(12px)',
                    },
                  },
                }}
              />

              {/* Botão de Login / Acesso */}
              <Button 
                component={RouterLink} 
                to={isLoginPage ? "/" : "/login"} 
                viewTransition
                variant={isLoginPage ? "outlined" : "contained"} 
                color="primary"
                startIcon={<LoginIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                sx={{
                  borderRadius: '10px',
                  px: { xs: 1.8, sm: 2.5 },
                  py: { xs: 0.6, sm: 0.8 },
                  fontSize: { xs: '0.78rem', sm: '0.85rem' },
                  fontWeight: 700,
                  fontFamily: "'Tektur', sans-serif",
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 10px rgba(2, 132, 199, 0.25)',
                  minHeight: 38
                }}
              >
                {isLoginPage ? "Início" : "Entrar"}
              </Button>

              {/* Botão Hambúrguer Mobile (Apenas em < md) */}
              {isHomePage && (
                <IconButton
                  onClick={() => setDrawerAberto(true)}
                  aria-label="Abrir menu"
                  sx={{
                    display: { xs: 'flex', md: 'none' },
                    color: 'text.primary',
                    bgcolor: alpha(theme.palette.divider, 0.1),
                    borderRadius: '10px',
                    p: 0.8,
                    minWidth: 38,
                    minHeight: 38,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.divider, 0.2)
                    }
                  }}
                >
                  <MenuIcon sx={{ fontSize: 22 }} />
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Gaveta Lateral Mobile (Drawer com Glassmorphism) */}
      <Drawer
        anchor="right"
        open={drawerAberto}
        onClose={() => setDrawerAberto(false)}
        slotProps={{
          paper: {
            sx: {
              width: '280px',
              maxWidth: '80vw',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(7, 14, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderLeft: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }
          }
        }}
      >
        <Box>
          {/* Topo do Drawer com Logo e Fechar */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 34, height: 34 }}>
                <LogoAnimadaSigma theme="ouro" width="100%" height="100%" showText={false} animated={false} />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: "'Tektur', sans-serif", fontWeight: 800, color: '#facc15' }}>
                SiGMa
              </Typography>
            </Box>
            <IconButton onClick={() => setDrawerAberto(false)} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2, borderColor: alpha(theme.palette.divider, 0.2) }} />

          {/* Lista de Navegação Mobile */}
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => scrollToSection('hero-section')} 
                sx={{ borderRadius: '12px', py: 1.2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'primary.main' }}>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Início" 
                  primaryTypographyProps={{ fontFamily: "'Tektur', sans-serif", fontWeight: 600, fontSize: '0.95rem' }} 
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => scrollToSection('modules-section')} 
                sx={{ borderRadius: '12px', py: 1.2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'primary.main' }}>
                  <AppsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Funcionalidades" 
                  primaryTypographyProps={{ fontFamily: "'Tektur', sans-serif", fontWeight: 600, fontSize: '0.95rem' }} 
                />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => scrollToSection('planos-section')} 
                sx={{ borderRadius: '12px', py: 1.2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'primary.main' }}>
                  <PlansIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Planos" 
                  primaryTypographyProps={{ fontFamily: "'Tektur', sans-serif", fontWeight: 600, fontSize: '0.95rem' }} 
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        {/* Rodapé do Drawer com Acesso e Alternador de Tema */}
        <Box sx={{ pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.15)}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              Tema Escuro / Claro
            </Typography>
            <Switch 
              checked={mode === 'dark'} 
              onChange={toggleColorMode} 
              size="small"
              color="primary" 
            />
          </Box>

          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<LoginIcon />}
            onClick={() => setDrawerAberto(false)}
            sx={{
              borderRadius: '12px',
              py: 1.2,
              fontFamily: "'Tektur', sans-serif",
              fontWeight: 700,
              fontSize: '0.9rem',
              textTransform: 'uppercase'
            }}
          >
            Acessar Sistema
          </Button>
        </Box>
      </Drawer>
    </>
  );
};
