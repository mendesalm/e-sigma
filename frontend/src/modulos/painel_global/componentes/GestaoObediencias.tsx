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
  cnpj?: string;
}

import { ModalEdicaoOrganizacao } from './ModalEdicaoOrganizacao';

export const GestaoObediencias: React.FC = () => {
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [orgSelecionada, setOrgSelecionada] = useState<any>(null);

  const fetchOrganizacoes = async () => {
    try {
      const resp = await axios.get('http://localhost:8000/api/v1/organizacoes/?limite=5000');
      setOrganizacoes(resp.data);
    } catch (error) {
      console.error("Erro ao buscar obediências:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizacoes();
  }, []);

  const abrirDetalhes = (org: Organizacao) => {
    setOrgSelecionada(org);
    setModalAberto(true);
  };

  const fecharDetalhes = () => {
    setModalAberto(false);
    setOrgSelecionada(null);
  };

  const orgsFiltradas = organizacoes.filter(org => {
    if (org.tipo === 'LOJA') return false;

    const matchBusca = org.nome.toLowerCase().includes(busca.toLowerCase()) || 
                       (org.cnpj && org.cnpj.includes(busca)) ||
                       (org.sigla && org.sigla.toLowerCase().includes(busca.toLowerCase()));
    
    return matchBusca;
  }).sort((a, b) => a.nome.localeCompare(b.nome));

  const obedienciasDisponiveis = organizacoes.filter(o => o.tipo === 'OBEDIENCIA' || o.tipo === 'SUBOBEDIENCIA');

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
          Gestão de Obediências e Subobediências
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: '#00E5FF', color: '#050f19', '&:hover': { backgroundColor: '#00b8cc' }}}>
          Nova Obediência
        </Button>
      </Box>
      
      <Paper sx={{ ...glassStyle, p: 3, mb: 4 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 12 }}>
            <TextField 
              fullWidth 
              label="Buscar Obediências ou Subobediências" 
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
        </Grid>

        <TableContainer sx={{ backgroundColor: 'transparent', maxHeight: '60vh' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Sigla</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Nome</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Classificação</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Subordinação</strong></TableCell>
                <TableCell align="right" sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Carregando dados...</TableCell>
                </TableRow>
              ) : orgsFiltradas.length > 0 ? (
                orgsFiltradas.map((org) => (
                  <TableRow key={org.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }}}>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{org.sigla || '-'}</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{org.nome}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Chip 
                        label={org.dados_especificos?.classificacao || org.tipo} 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'rgba(156, 39, 176, 0.2)',
                          color: '#e1bee7',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      {(() => {
                        if (!org.organizacao_superior_id) return '-';
                        const parent = obedienciasDisponiveis.find(o => o.id === org.organizacao_superior_id);
                        if (!parent) return 'Desconhecida';
                        return parent.nome;
                      })()}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Button variant="outlined" size="small" onClick={() => abrirDetalhes(org)} sx={{ color: '#00E5FF', borderColor: 'rgba(0,229,255,0.5)', '&:hover': { borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.1)' }}}>
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Nenhuma obediência encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
