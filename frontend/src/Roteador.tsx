import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importação das Fatias Verticais (Módulos)
import { PaginaAterrissagem } from './modulos/saas/PaginaAterrissagem';
import { PaginaLogin } from './modulos/saas/PaginaLogin';
import { DashboardGlobal } from './modulos/painel_global/DashboardGlobal';
import { DashboardCentral } from './modulos/painel_central/DashboardCentral';
import { DashboardLocal } from './modulos/painel_local/DashboardLocal';
import { RotaPrivada } from './compartilhado/contextos/RotaPrivada';

/**
 * Roteador Principal da Aplicação Sigma 2.0.
 * Gerencia a navegação entre a Landing Page Comercial e os 3 Níveis de Painel (SaaS).
 */
export const Roteador: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Raiz (SaaS Landing Page Comercial) */}
        <Route path="/" element={<PaginaAterrissagem />} />
        
        {/* Rota de Autenticação Única */}
        <Route path="/login" element={<PaginaLogin />} />
        
        {/* Fatias Verticais (Dashboards Multi-Tenant protegidos) */}
        <Route path="/global" element={
          <RotaPrivada allowedRoles={['super_admin']}>
            <DashboardGlobal />
          </RotaPrivada>
        } />
        <Route path="/central" element={
          <RotaPrivada allowedRoles={['super_admin', 'webmaster']}>
            <DashboardCentral />
          </RotaPrivada>
        } />
        <Route path="/local" element={
          <RotaPrivada allowedRoles={['super_admin', 'webmaster', 'member']}>
            <DashboardLocal />
          </RotaPrivada>
        } />
        
        {/* Fallback para rotas inexistentes (404) */}
        <Route path="*" element={
          <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
            <h1>Erro 404</h1>
            <p>Página não encontrada no Sigma 2.0</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};

