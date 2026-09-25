import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { PaginaAterrissagem } from '../modulos/saas/PaginaAterrissagem';
import { CustomThemeProvider } from '../compartilhado/contextos/ThemeContext';

// Mock de canvas e animações para execução limpa no jsdom
vi.mock('../modulos/saas/FundoHero', () => ({
  default: () => <div data-testid="fundo-hero-mock" />
}));

vi.mock('../modulos/saas/FundoRecursos', () => ({
  default: () => <div data-testid="fundo-recursos-mock" />
}));

describe('Página Pública de Aterrissagem (Clone Legado)', () => {
  it('deve renderizar o título principal e as seções modulares e de planos', () => {
    render(
      <BrowserRouter>
        <CustomThemeProvider>
          <PaginaAterrissagem />
        </CustomThemeProvider>
      </BrowserRouter>
    );

    // Verifica o título Hero institucional (presente no Cabecalho e no h1)
    const titulosHero = screen.getAllByText(/Sistema Integrado de/i);
    expect(titulosHero.length).toBeGreaterThanOrEqual(1);
    expect(titulosHero[0]).toBeInTheDocument();

    const subtitulos = screen.getAllByText(/Gerenciamento Maçônico/i);
    expect(subtitulos.length).toBeGreaterThanOrEqual(1);

    // Verifica a seção dos módulos centrais
    expect(screen.getByText('Secretaria')).toBeInTheDocument();
    expect(screen.getByText('Chancelaria')).toBeInTheDocument();
    expect(screen.getByText('Tesouraria')).toBeInTheDocument();

    // Verifica a seção de Planos e Assinaturas
    expect(screen.getByText('Planos e Assinaturas')).toBeInTheDocument();
    expect(screen.getByText('BÁSICO')).toBeInTheDocument();
    expect(screen.getByText('INTERMEDIÁRIO')).toBeInTheDocument();
    expect(screen.getByText('AVANÇADO')).toBeInTheDocument();

    // Verifica o CTA final de teste gratuito
    expect(screen.getByText(/Prepare sua Loja para o Futuro/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /INICIAR TESTE GRATUITO/i })).toBeInTheDocument();
  });
});
