/**
 * Utilitário centralizado para resolução dinâmica de URLs dos módulos satélites e da API em runtime.
 * Garante que em produção (domínio *.e-sigma.app ou e-sigma.app) os links e requisições
 * apontem para os domínios reais de produção e não para localhost.
 */

export function obterUrlModulo(modulo: 'corevm' | 'lojas' | 'harmonia'): string {
  // Verifica se estamos em ambiente de produção (navegador com hostname web)
  const isProd = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  if (isProd) {
    switch (modulo) {
      case 'corevm':
        return import.meta.env.VITE_COREVM_URL || 'https://core.e-sigma.app';
      case 'lojas':
        return import.meta.env.VITE_LOJAS_URL || 'https://lojas.e-sigma.app';
      case 'harmonia':
        return import.meta.env.VITE_HARMONIA_URL || 'https://harmonia.e-sigma.app';
    }
  }

  // Ambiente de desenvolvimento local
  switch (modulo) {
    case 'corevm':
      return import.meta.env.VITE_COREVM_URL || 'http://localhost:5174';
    case 'lojas':
      return import.meta.env.VITE_LOJAS_URL || 'http://localhost:5175';
    case 'harmonia':
      return import.meta.env.VITE_HARMONIA_URL || 'http://localhost:5178';
  }
}

export function obterUrlEsigmaApi(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const isProd = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';
  if (isProd) {
    return '/api/v1';
  }
  return 'http://localhost:8000/api/v1';
}

export const URLS_SATELITES = {
  get corevm() {
    return obterUrlModulo('corevm');
  },
  get lojas() {
    return obterUrlModulo('lojas');
  },
  get harmonia() {
    return obterUrlModulo('harmonia');
  }
};
