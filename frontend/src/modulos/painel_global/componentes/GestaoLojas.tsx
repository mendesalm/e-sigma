import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button, TextField,
  Tabs, Tab, Grid, FormControl, InputLabel, Select, MenuItem, TablePagination
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
import { ModalImportacaoMassa } from './ModalImportacaoMassa';

export const GestaoLojas: React.FC = () => {
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroObediencia, setFiltroObediencia] = useState('');
  
  // Estado para o modal de detalhes
  const [modalAberto, setModalAberto] = useState(false);
  const [orgSelecionada, setOrgSelecionada] = useState<any>(null);

  // Estado para modal de importação
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);

  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchOrganizacoes = async () => {
    try {
      const resp = await axios.get('http://localhost:8000/api/v1/organizacoes/?limite=5000');
      setOrganizacoes(resp.data);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
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
    if (org.tipo !== 'LOJA') return false;

    const matchBusca = org.nome.toLowerCase().includes(busca.toLowerCase()) || 
                       (org.cnpj && org.cnpj.includes(busca)) ||
                       (org.sigla && org.sigla.toLowerCase().includes(busca.toLowerCase()));
    
    if (!matchBusca) return false;
    
    if (filtroObediencia) {
      if (org.organizacao_superior_id !== filtroObediencia) {
        const parent = organizacoes.find(o => o.id === org.organizacao_superior_id);
        if (!parent || parent.organizacao_superior_id !== filtroObediencia) {
          return false;
        }
      }
    }

    return true;
  }).sort((a, b) => {
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
          Gestão de Lojas
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => setModalImportacaoAberto(true)} sx={{ color: '#00E5FF', borderColor: '#00E5FF', '&:hover': { backgroundColor: 'rgba(0, 229, 255, 0.1)' }}}>
            Importar CSV
          </Button>
          <Button variant="contained" onClick={() => { setOrgSelecionada({ id: 'novo', nome: '', tipo: 'LOJA', cliente_ativo_sigma: false, criado_em: new Date().toISOString(), dados_especificos: {} }); setModalAberto(true); }} sx={{ backgroundColor: '#00E5FF', color: '#050f19', '&:hover': { backgroundColor: '#00b8cc' }}}>
            Nova Loja
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ ...glassStyle, p: 3, mb: 4 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField 
              fullWidth 
              label="Buscar Lojas" 
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
          <Grid size={{ xs: 12, sm: 6 }}>
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
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Título</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Nome</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Número</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Obediência</strong></TableCell>
                <TableCell align="right" sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Carregando dados...</TableCell>
                </TableRow>
              ) : orgsFiltradas.length > 0 ? (
                orgsFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((org) => (
                  <TableRow key={org.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }}}>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {org.dados_especificos?.titulo || '-'}
                    </TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{org.nome}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {org.sigla || '-'}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      {(() => {
                        if (!org.organizacao_superior_id) return '-';
                        const parent = obedienciasDisponiveis.find(o => o.id === org.organizacao_superior_id);
                        if (!parent) return 'Desconhecida';
                        if (parent.tipo === 'SUBOBEDIENCIA' && parent.organizacao_superior_id) {
                          const grandParent = obedienciasDisponiveis.find(o => o.id === parent.organizacao_superior_id);
                          const gName = grandParent ? grandParent.sigla || grandParent.nome : '';
                          const pName = parent.sigla || parent.nome;
                          return gName ? `${gName} / ${pName}` : pName;
                        }
                        return parent.sigla || parent.nome;
                      })()}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Button variant="outlined" size="small" onClick={() => abrirDetalhes(org)} sx={{ color: '#00E5FF', borderColor: 'rgba(0,229,255,0.5)', '&:hover': { borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.1)' }}}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Nenhuma loja encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={orgsFiltradas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lojas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`}
          sx={{ color: 'white', borderTop: '1px solid rgba(255,255,255,0.1)' }}
        />
      </Paper>
      {modalAberto && (
        <ModalEdicaoOrganizacao 
          open={modalAberto}
          onClose={fecharDetalhes}
          org={orgSelecionada}
          onSaveSuccess={fetchOrganizacoes}
          todasOrganizacoes={organizacoes}
        />
      )}

      {modalImportacaoAberto && (
        <ModalImportacaoMassa
          aberto={modalImportacaoAberto}
          fechar={() => setModalImportacaoAberto(false)}
          onSuccess={fetchOrganizacoes}
        />
      )}
    </Box>
  );
};
