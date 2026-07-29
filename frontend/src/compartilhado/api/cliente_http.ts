import axios from 'axios';

/**
 * Cliente HTTP Global (Axios) para a Aplicação.
 * Centraliza as requisições para a API do Sigma 2.0 (FastAPI).
 */
export const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição para injetar Tokens JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (erro) => {
    return Promise.reject(erro);
  }
);

// Interceptor de Resposta para capturar 401 Unauthorized globalmente
api.interceptors.response.use(
  (resposta) => {
    return resposta;
  },
  (erro) => {
    if (erro.response && erro.response.status === 401) {
      console.warn("Acesso negado (401). Disparando force_logout.");
      window.dispatchEvent(new Event('force_logout'));
    }
    return Promise.reject(erro);
  }
);

export default api;
