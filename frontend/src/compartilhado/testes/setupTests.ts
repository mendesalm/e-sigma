import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Limpa a árvore de componentes após cada teste para evitar vazamentos de estado
afterEach(() => {
  cleanup();
});
