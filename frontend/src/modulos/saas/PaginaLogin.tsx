import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../compartilhado/contextos/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { LogoAnimadaSigma } from '../../compartilhado/componentes/LogoAnimadaSigma';
import FirstAccessWizard from './componentes/FirstAccessWizard';
import { motion } from 'framer-motion';
import HeroBackground from './componentes/HeroBackground';

import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';

const AnimatedBox = motion.create(Box);

export const PaginaLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleResetPotencia = () => {
    if (window.confirm("Atenção: Redefinir a Potência apagará sua escolha atual e o levá-lo-á de volta à tela inicial. Deseja continuar?")) {
      localStorage.removeItem('tenant_potencia');
      navigate('/');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    try {
      if (!credentialResponse.credential) throw new Error("Credencial inválida.");
      const user = await loginWithGoogle(credentialResponse.credential);
      if (user.requires_selection) {
        navigate('/select-lodge');
      } else if (user.role === 'super_admin') {
        navigate('/global');
      } else if (user.role === 'webmaster') {
        if (user.obedience_id) {
          navigate('/central');
        } else {
          navigate('/local');
        }
      } else if (user.role === 'member') {
        navigate('/local');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.response?.data?.errors?.[0]?.msg || 'Falha no login com Google. Seu e-mail não está cadastrado no sistema.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const user = await login(email, password);
      
      // Regra de Negócio: Rotas baseadas no JWT Payload
      if (user.requires_selection) {
        navigate('/select-lodge'); // Todo: Tela de seleção de associação
      } else if (user.role === 'super_admin') {
        navigate('/global');
      } else if (user.role === 'webmaster') {
        if (user.obedience_id) {
          navigate('/central');
        } else {
          navigate('/local');
        }
      } else if (user.role === 'member') {
        navigate('/local');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.response?.data?.errors?.[0]?.msg || 'Falha no login. Verifique suas credenciais.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        color: "text.primary", 
        minHeight: "100vh", 
        display: "flex",
        flexDirection: "column",
        position: 'relative', 
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <HeroBackground />
      </Box>

      <Container component="main" maxWidth="sm" sx={{
        position: 'relative',
        zIndex: 1,
        margin: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        py: 4,
      }}>
        <AnimatedBox
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(19, 27, 41, 0.4)' : 'rgba(255, 255, 255, 0.6)', 
            backdropFilter: 'blur(20px)', 
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)', 
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', 
            width: '100%',
          }}
        >
          <Box sx={{ mb: 1, mt: 1, display: 'flex', justifyContent: 'center' }}>
            <LogoAnimadaSigma theme="cyber" width={100} height={100} showText={false} />
          </Box>
          <Typography 
            component="h1" 
            variant="h4" 
            sx={{ 
              mb: 1, 
              fontWeight: 700, 
              fontFamily: "'Tektur', sans-serif",
              background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(to right, #38bdf8, #0284c7)' : 'linear-gradient(to right, #0284c7, #0369a1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: (theme) => theme.palette.mode === 'dark' ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.3))' : 'none'
            }}
          >
            Acesso Restrito
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontFamily: "'Inter', sans-serif" }}>
            Insira suas credenciais para continuar
          </Typography>

          <Box component="form" onSubmit={handleFormSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="CIM ou E-mail"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              variant="outlined"
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    value="remember"
                    color="primary"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Lembrar-me</Typography>}
              />
              <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Esqueci a senha
              </Link>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ 
                py: 1.5, 
                mb: 3, 
                fontSize: '1rem', 
                borderRadius: 2,
                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 14px 0 rgba(56, 189, 248, 0.39)' : '0 4px 14px 0 rgba(2, 132, 199, 0.39)',
                '&:hover': {
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 6px 20px rgba(56, 189, 248, 0.23)' : '0 6px 20px rgba(2, 132, 199, 0.23)'
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
              <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>ou</Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  enqueueSnackbar('Ocorreu um erro ao tentar fazer login com o Google', { variant: 'error' });
                }}
                theme={document.body.style.backgroundColor === '#0b111b' ? 'filled_black' : 'outline'}
                text="continue_with"
                width="100%"
              />
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Não tem uma conta?{' '}
                <Link component={RouterLink} to="/register" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>
                  Solicitar cadastro
                </Link>
              </Typography>
              
              <Button 
                variant="outlined" 
                onClick={() => setWizardOpen(true)} 
                sx={{ mt: 1, borderRadius: 2, py: 1, width: '100%' }}
              >
                Primeiro Acesso / Ativar Conta
              </Button>
              
              <Button 
                variant="text" 
                onClick={handleResetPotencia} 
                sx={{ mt: 2, fontSize: '0.75rem', color: 'text.secondary', opacity: 0.6, '&:hover': { opacity: 1 } }}
              >
                Redefinir Potência Selecionada
              </Button>
            </Box>
          </Box>
        </AnimatedBox>
      </Container>
      <FirstAccessWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </Box>
  );
};
