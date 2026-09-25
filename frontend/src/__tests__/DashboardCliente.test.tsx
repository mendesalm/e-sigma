import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { DashboardCliente } from '../modulos/painel_cliente/DashboardCliente';
import { CustomThemeProvider } from '../compartilhado/contextos/ThemeContext';
import { SnackbarProvider } from 'notistack';

// Mock do AuthContext
vi.mock('../compartilhado/contextos/AuthContext', () => ({
  useAuth: () => ({
    user: {
      sub: 'veneravel@loja2181.org.br',
      user_id: 'user-123',
      role: 'webmaster'
    },
    logout: vi.fn(),
  }),
}));

describe('Dashboard do Cliente e-Sigma (Hub de Módulos & Assinatura)', () => {
  it('deve renderizar todos os módulos satélites, dados de faturamento e canais de suporte', () => {
    render(
      <BrowserRouter>
        <CustomThemeProvider>
          <SnackbarProvider>
            <DashboardCliente />
          </SnackbarProvider>
        </CustomThemeProvider>
      </BrowserRouter>
    );

    // Verifica cabeçalho e título
    expect(screen.getByText('SiGMa Hub')).toBeInTheDocument();
    expect(screen.getByText('Portal do Ecossistema SiGMa')).toBeInTheDocument();

    // Verifica módulos satélites
    expect(screen.getByText('Módulo Lojas')).toBeInTheDocument();
    expect(screen.getByText('CoReVM (Regional)')).toBeInTheDocument();
    expect(screen.getByText('Módulo Harmonia')).toBeInTheDocument();

    // Verifica botões de acesso
    expect(screen.getByRole('button', { name: /Acessar Lojas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acessar CoReVM/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acessar Harmonia/i })).toBeInTheDocument();

    // Verifica dados de faturamento e nuvem
    expect(screen.getByText('Dados de Cobrança')).toBeInTheDocument();
    expect(screen.getByText('Intermediário (Anual)')).toBeInTheDocument();
    expect(screen.getByText('Armazenamento & Recursos da Nuvem')).toBeInTheDocument();

    // Verifica abas de suporte
    expect(screen.getByText('Reportar Bug ou Inconsistência')).toBeInTheDocument();
    expect(screen.getByText('Enviar Sugestão de Melhoria')).toBeInTheDocument();
    expect(screen.getByText('Meus Chamados de Suporte')).toBeInTheDocument();
  });
});
