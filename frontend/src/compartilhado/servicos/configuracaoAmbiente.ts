/**
 * Utilitário centralizado para resolução dinâmica de URLs dos módulos satélites e da API em runtime.
 * Por padrão, aponta SEMPRE para os domínios reais de produção (core.e-sigma.app, lojas.e-sigma.app, harmonia.e-sigma.app),
 * garantindo funcionamento impecável tanto na web de produção quanto no app móvel Capacitor Android
 * (cujo hostname de WebView é 'localhost') e em acessos locais.
 *
 * Para forçar portas locais de desenvolvimento (localhost:5174, etc.), o desenvolvedor deve
 * definir explicitamente VITE_USAR_SATELITES_LOCAIS=true no seu arquivo .env.
 */

export function obterUrlModulo(modulo: 'corevm' | 'lojas' | 'harmonia'): string {
  // Apenas usa localhost se houver sinalização EXPLÍCITA de desenvolvimento local de satélites
  const usarSatelitesLocais = import.meta.env.VITE_USAR_SATELITES_LOCAIS === 'true';

  if (usarSatelitesLocais) {
    switch (modulo) {
      case 'corevm':
        return import.meta.env.VITE_COREVM_URL || 'http://localhost:5174';
      case 'lojas':
        return import.meta.env.VITE_LOJAS_URL || 'http://localhost:5175';
      case 'harmonia':
        return import.meta.env.VITE_HARMONIA_URL || 'http://localhost:5178';
    }
  }

  // Padrão canônico de produção e mobile (Capacitor/PWA/Nuvem)
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

export function obterUrlEsigmaApi(): string {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = (hostname === 'localhost' || hostname === '127.0.0.1') && import.meta.env.VITE_USAR_BACKEND_LOCAL === 'true';

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
