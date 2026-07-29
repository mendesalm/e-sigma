import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import temaMui from './compartilhado/tema/tema_mui'
import { SnackbarProvider } from 'notistack'
import { AuthProvider } from './compartilhado/contextos/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Roteador } from './Roteador'
import './index.css'

// Criação do client ID a partir do ambiente (.env), com fallback de segurança visual se ausente
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'COLOQUE_SEU_CLIENT_ID_AQUI';

/**
 * Ponto de entrada (Entrypoint) do Frontend React.
 * Aqui injetamos o Design System (Material UI) globalmente com o Tema Escuro (Dark Navy).
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={temaMui}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <Roteador />
          </AuthProvider>
        </GoogleOAuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
)
