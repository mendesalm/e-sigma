import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { PaginaLogin } from '../modulos/saas/PaginaLogin';
import { SnackbarProvider } from 'notistack';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Mock do AuthContext para isolar o componente
vi.mock('../compartilhado/contextos/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
  }),
}));

// Como a página possui componentes complexos de animação (Framer/Canvas), vamos focar apenas no DOM básico.
// Muitas vezes em testes unitários você mocka o canvas se necessário, mas o jsdom lida razoavelmente com Box básicos.

describe('Página de Login (Unidade)', () => {
  it('deve renderizar o título principal e os campos de input', () => {
    render(
      <BrowserRouter>
        <SnackbarProvider>
          <GoogleOAuthProvider clientId="fake-client-id">
            <PaginaLogin />
          </GoogleOAuthProvider>
        </SnackbarProvider>
      </BrowserRouter>
    );

    // Verifica se o título apareceu
    expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
    
    // Verifica se o campo de E-mail existe
    expect(screen.getByLabelText(/CIM ou E-mail/i)).toBeInTheDocument();
    
    // Verifica se o campo de Senha existe
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    
    // Verifica o botão de Login Tradicional
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });
});
