import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Button 
} from '@mui/material';
import axios from 'axios';

interface PlanoSaaS {
  id: string;
  nome: string;
  valor_mensal: number;
}

export const GestaoAssinaturas: React.FC = () => {
  const [planos, setPlanos] = useState<PlanoSaaS[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlanos = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/saas/planos');
      setPlanos(response.data);
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanos();
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
          Monitoramento de Assinaturas (SaaS)
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: '#00E5FF', color: '#050f19', '&:hover': { backgroundColor: '#00b8cc' }}}>
          Novo Plano
        </Button>
      </Box>

      <Paper sx={{ ...glassStyle, p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>Planos Base</Typography>
        
        <TableContainer sx={{ backgroundColor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Plano</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Valor Mensal</strong></TableCell>
                <TableCell sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Status</strong></TableCell>
                <TableCell align="right" sx={{ backgroundColor: 'rgba(5, 15, 25, 0.9)', color: '#00E5FF', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Carregando dados...</TableCell>
                </TableRow>
              ) : planos.length > 0 ? (
                planos.map((plano) => (
                  <TableRow key={plano.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }}}>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{plano.nome}</TableCell>
                    <TableCell sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>R$ {plano.valor_mensal.toFixed(2)}</TableCell>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Chip label="Ativo" sx={{ backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#a5d6a7', border: '1px solid rgba(76, 175, 80, 0.3)' }} size="small" />
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Button size="small" sx={{ color: '#00E5FF', borderColor: 'rgba(0,229,255,0.5)', '&:hover': { borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.1)' } }} variant="outlined">Editar</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Nenhum plano encontrado. Crie o primeiro plano!</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
