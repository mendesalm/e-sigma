import axios from 'axios';

/**
 * Cliente HTTP Global (Axios) para a Aplicação.
 * Centraliza as requisições para a API do Sigma 2.0 (FastAPI).
 */
const clienteHttp = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição (Útil para injetar Tokens JWT futuramente)
clienteHttp.interceptors.request.use(
  (config) => {
    // Exemplo: const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (erro) => {
    return Promise.reject(erro);
  }
);

// Interceptor de Resposta (Útil para capturar 401 Unauthorized globalmente)
clienteHttp.interceptors.response.use(
  (resposta) => {
    return resposta;
  },
  (erro) => {
    if (erro.response && erro.response.status === 401) {
      console.warn("Acesso negado. Usuário deve ser deslogado.");
      // Lógica de logout automático entraria aqui
    }
    return Promise.reject(erro);
  }
);

export default clienteHttp;
