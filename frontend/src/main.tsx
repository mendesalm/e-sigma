import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CustomThemeProvider } from './compartilhado/contextos/ThemeContext'
import CssBaseline from '@mui/material/CssBaseline'
import { SnackbarProvider } from 'notistack'
import { AuthProvider } from './compartilhado/contextos/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Roteador } from './Roteador'
import './index.css'

// Criação do client ID a partir do ambiente (.env), com fallback de segurança visual se ausente
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'COLOQUE_SEU_CLIENT_ID_AQUI';

/**
 * Ponto de entrada (Entrypoint) do Frontend React.
 * Utiliza o CustomThemeProvider para suporte completo a Dark/Light mode com persistência local.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CustomThemeProvider>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <Roteador />
          </AuthProvider>
        </GoogleOAuthProvider>
      </SnackbarProvider>
    </CustomThemeProvider>
  </StrictMode>,
)

// Registro do Service Worker PWA para suporte offline e instalabilidade
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.debug('Falha não-bloqueante no registro do Service Worker:', err);
    });
  });
}


