/**
 * Utilitário centralizado para resolução dinâmica de URLs dos módulos satélites e da API em runtime.
 * Garante que em produção (domínio *.e-sigma.app ou e-sigma.app) os links e requisições
 * apontem para os domínios reais de produção e não para localhost.
 */

export function obterUrlModulo(modulo: 'corevm' | 'lojas' | 'harmonia'): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // Se NÃO for estritamente localhost/127.0.0.1 (ex.: e-sigma.app ou IP de produção),
  // FORÇA SEMPRE os domínios HTTPS reais de produção
  if (!isLocal) {
    switch (modulo) {
      case 'corevm': {
        const envVal = import.meta.env.VITE_COREVM_URL;
        return (envVal && !envVal.includes('localhost') && !envVal.includes('127.0.0.1'))
          ? envVal
          : 'https://core.e-sigma.app';
      }
      case 'lojas': {
        const envVal = import.meta.env.VITE_LOJAS_URL;
        return (envVal && !envVal.includes('localhost') && !envVal.includes('127.0.0.1'))
          ? envVal
          : 'https://lojas.e-sigma.app';
      }
      case 'harmonia': {
        const envVal = import.meta.env.VITE_HARMONIA_URL;
        return (envVal && !envVal.includes('localhost') && !envVal.includes('127.0.0.1'))
          ? envVal
          : 'https://harmonia.e-sigma.app';
      }
    }
  }

  // Ambiente de desenvolvimento local puro (localhost)
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
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (!isLocal) {
    const envVal = import.meta.env.VITE_API_URL;
    if (envVal && !envVal.includes('localhost') && !envVal.includes('127.0.0.1')) {
      return envVal;
    }
    return '/api/v1';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
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
