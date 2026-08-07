import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button, TextField,
  Tabs, Tab, Grid, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import axios from 'axios';

interface Organizacao {
  id: string;
  nome: string;
  sigla?: string;
  tipo: string;
  cliente_ativo_sigma: boolean;
  dados_especificos?: any;
  criado_em?: string;
  organizacao_superior_id?: string;
}

import { ModalEdicaoOrganizacao } from './ModalEdicaoOrganizacao';

export const GestaoOrganizacoes: React.FC = () => {
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroObediencia, setFiltroObediencia] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Estado para o modal de detalhes
  const [modalAberto, setModalAberto] = useState(false);
  const [orgSelecionada, setOrgSelecionada] = useState<Organizacao | null>(null);

  const abrirDetalhes = (org: Organizacao) => {
    setOrgSelecionada(org);
    setModalAberto(true);
  };

  const fecharDetalhes = () => {
    setModalAberto(false);
    setOrgSelecionada(null);
  };

  const fetchOrganizacoes = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/organizacoes/?limite=5000');
      setOrganizacoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar organizações:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizacoes();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 0 = Todas, 1 = Lojas, 2 = Obediências, 3 = Ativas, 4 = Inativas
  const orgsFiltradas = organizacoes.filter(org => {
    const matchBusca = org.nome.toLowerCase().includes(busca.toLowerCase()) || 
                      (org.sigla && org.sigla.toLowerCase().includes(busca.toLowerCase()));
    
    if (!matchBusca) return false;
    
    if (filtroObediencia && org.organizacao_superior_id !== filtroObediencia) return false;

    if (tabValue === 1) return org.tipo === 'LOJA';
    if (tabValue === 2) return org.tipo === 'OBEDIENCIA';
    if (tabValue === 3) return org.cliente_ativo_sigma === true;
    if (tabValue === 4) return org.cliente_ativo_sigma === false;
    
    return true; // tabValue === 0
  }).sort((a, b) => {
    // Sort logic: numerically by sigla if both are numbers, otherwise alphabetically by name
    const siglaA = parseInt(a.sigla || '0', 10);
    const siglaB = parseInt(b.sigla || '0', 10);
    
    if (!isNaN(siglaA) && !isNaN(siglaB) && siglaA !== 0 && siglaB !== 0) {
      return siglaA - siglaB;
    }
    return a.nome.localeCompare(b.nome);
  });

  const obedienciasDisponiveis = organizacoes.filter(o => o.tipo === 'OBEDIENCIA' || o.tipo === 'SUBOBEDIENCIA').sort((a, b) => a.nome.localeCompare(b.nome));

  const glassStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    borderRadius: 4
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: '#00E5FF', fontWeight: 'bold' }}>
          Gestão de Lojas e Obediências
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: '#00E5FF', color: '#050f19', '&:hover': { backgroundColor: '#00b8cc' }}}>
          Nova Organização
        </Button>
      </Box>
      
      <Paper sx={{ ...glassStyle, p: 3, mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ mb: 3, '& .MuiTabs-indicator': { backgroundColor: '#00E5FF' } }}
        >
          <Tab label="Todas" />
          <Tab label="Lojas" />
          <Tab label="Obediências" />
          <Tab label="Assinantes Ativos" />
          <Tab label="Lojas Espelho" />
        </Tabs>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              label="Buscar Lojas ou Obediências" 
              variant="outlined" 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: '#00E5FF' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: '#00E5FF' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiSvgIcon-root': { color: 'white' }
              }}>
              <InputLabel>Filtrar por Obediência/Mãe</InputLabel>
              <Select 
                value={filtroObediencia} 
                label="Filtrar por Obediência/Mãe"
                onChange={(e) => setFiltroObediencia(e.target.value)}
              >
                <MenuItem value=""><em>Todas</em></MenuItem>
                {obedienciasDisponiveis.map(ob => (
                  <MenuItem key={ob.id} value={ob.id}>{ob.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer sx={{ backgroundColor: 'transparent', maxHeight: '60vh' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Sigla/Número</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Nome</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Tipo</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Subordinação</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Status SaaS</strong></TableCell>
                <TableCell align="right" sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Carregando dados...</TableCell>
                </TableRow>
              ) : orgsFiltradas.length > 0 ? (
                orgsFiltradas.slice(0, 50).map((org) => (
                  <TableRow key={org.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }}}>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{org.sigla || '-'}</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{org.nome}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Chip 
                        label={org.tipo === 'LOJA' ? org.tipo : (org.dados_especificos?.classificacao || org.tipo)} 
                        size="small" 
                        sx={{ 
                          backgroundColor: org.tipo !== 'LOJA' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          color: org.tipo !== 'LOJA' ? '#e1bee7' : 'white',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      {(() => {
                        if (!org.organizacao_superior_id) return '-';
                        const parent = obedienciasDisponiveis.find(o => o.id === org.organizacao_superior_id);
                        if (!parent) return 'Desconhecida';
                        if (parent.tipo === 'SUBOBEDIENCIA' && parent.organizacao_superior_id) {
                          const grandParent = obedienciasDisponiveis.find(o => o.id === parent.organizacao_superior_id);
                          return grandParent ? grandParent.nome : parent.nome;
                        }
                        return parent.nome;
                      })()}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {org.cliente_ativo_sigma ? (
                        <Chip label="Assinante Ativo" sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#a5d6a7', border: '1px solid rgba(76, 175, 80, 0.3)' }} size="small" />
                      ) : (
                        <Chip label="Espelho (Inativo)" sx={{ backgroundColor: 'rgba(255, 152, 0, 0.2)', color: '#ffcc80', border: '1px solid rgba(255, 152, 0, 0.3)' }} size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Button onClick={() => abrirDetalhes(org)} size="small" sx={{ color: '#00E5FF', borderColor: 'rgba(0,229,255,0.5)', '&:hover': { borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.1)' } }} variant="outlined">Detalhes</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Nenhuma organização encontrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'rgba(255,255,255,0.5)' }}>
          * Exibindo no máximo 50 resultados para performance.
        </Typography>
      </Paper>

      <ModalEdicaoOrganizacao 
        open={modalAberto}
        onClose={fecharDetalhes}
        org={orgSelecionada}
        todasOrganizacoes={organizacoes}
        onSaveSuccess={() => {
          fetchOrganizacoes();
        }}
      />
    </Box>
  );
};
