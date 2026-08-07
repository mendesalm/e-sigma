import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button 
} from '@mui/material';
import axios from 'axios';

interface TratadoAmizade {
  id: string;
  obediencia_1_id: string;
  obediencia_2_id: string;
  ativo: boolean;
}

export const GestaoTratados: React.FC = () => {
  const [tratados, setTratados] = useState<TratadoAmizade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTratados = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/saas/tratados');
      setTratados(response.data);
    } catch (error) {
      console.error("Erro ao buscar tratados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTratados();
  }, []);

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
          Gestão de Tratados de Amizade
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: '#00E5FF', color: '#050f19', '&:hover': { backgroundColor: '#00b8cc' }}}>
          Novo Tratado
        </Button>
      </Box>

      <Paper sx={{ ...glassStyle, p: 3, mb: 4 }}>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
          Configure as relações de mútuo reconhecimento entre Obediências. Isso permite a intervisitação de membros no sistema.
        </Typography>
        
        <TableContainer sx={{ backgroundColor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>ID do Tratado</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Obediência 1</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Obediência 2</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Status</strong></TableCell>
                <TableCell align="right" sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Carregando dados...</TableCell>
                </TableRow>
              ) : tratados.length > 0 ? (
                tratados.map((tratado) => (
                  <TableRow key={tratado.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }}}>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{tratado.id}</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{tratado.obediencia_1_id}</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{tratado.obediencia_2_id}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {tratado.ativo ? (
                        <Chip label="Ativo" sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#a5d6a7', border: '1px solid rgba(76, 175, 80, 0.3)' }} size="small" />
                      ) : (
                        <Chip label="Inativo" sx={{ backgroundColor: 'rgba(244, 67, 54, 0.2)', color: '#ef9a9a', border: '1px solid rgba(244, 67, 54, 0.3)' }} size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Button size="small" sx={{ color: '#00E5FF', borderColor: 'rgba(0,229,255,0.5)', '&:hover': { borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.1)' } }} variant="outlined">Detalhes</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Nenhum tratado configurado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
