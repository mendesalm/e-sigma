import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import temaMui from './compartilhado/tema/tema_mui'
import { Roteador } from './Roteador'
import './index.css'

/**
 * Ponto de entrada (Entrypoint) do Frontend React.
 * Aqui injetamos o Design System (Material UI) globalmente com o Tema Escuro (Dark Navy).
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ThemeProvider aplica a paleta de cores e tipografia da V1 em toda a aplicação */}
    <ThemeProvider theme={temaMui}>
      {/* CssBaseline injeta resets CSS nativos do Material UI, garantindo consistência */}
      <CssBaseline />
      <Roteador />
    </ThemeProvider>
  </StrictMode>,
)
