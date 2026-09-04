import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  Typography, Box, Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, Paper, Chip
} from '@mui/material';
import axios from 'axios';

interface Props {
  aberto: boolean;
  fechar: () => void;
  onSuccess: () => void;
}

export const ModalImportacaoMassa: React.FC<Props> = ({ aberto, fechar, onSuccess }) => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);
  const [fase, setFase] = useState<'UPLOAD' | 'PREVIEW' | 'CONCLUIDO'>('UPLOAD');
  const [mensagemGlobal, setMensagemGlobal] = useState('');

  const handleUpload = async () => {
    if (!arquivo) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    try {
      const resp = await axios.post('http://localhost:8000/api/v1/organizacoes/importar/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResultados(resp.data.resultados);
      setFase('PREVIEW');
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erro ao processar CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    setLoading(true);
    // Filtrar apenas os prontos para inserção
    const itensValidos = resultados.filter(r => r.status === 'PRONTO').map(r => r.dados);
    
    if (itensValidos.length === 0) {
      alert("Nenhuma organização válida para importar.");
      setLoading(false);
      return;
    }

    try {
      const resp = await axios.post('http://localhost:8000/api/v1/organizacoes/importar/confirmar', { itens: itensValidos });
      setMensagemGlobal(resp.data.mensagem);
      setFase('CONCLUIDO');
      onSuccess();
    } catch (error: any) {
      alert("Erro ao confirmar importação.");
    } finally {
      setLoading(false);
    }
  };

  const resetar = () => {
    setArquivo(null);
    setResultados([]);
    setFase('UPLOAD');
    setMensagemGlobal('');
    fechar();
  };

  const qtdProntos = resultados.filter(r => r.status === 'PRONTO').length;
  const qtdColisoes = resultados.filter(r => r.status === 'COLISAO').length;
  const qtdErros = resultados.filter(r => r.status === 'ERRO' || r.status === 'AVISO').length;

  return (
    <Dialog open={aberto} onClose={fechar} maxWidth="lg" fullWidth PaperProps={{ sx: { backgroundColor: '#050f19', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}}>
      <DialogTitle sx={{ color: '#00E5FF' }}>Importação em Massa (CSV)</DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        {fase === 'UPLOAD' && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Envie um arquivo CSV contendo as colunas: <strong>nome, sigla, tipo, cnpj, rito, mae_sigla</strong>.
            </Typography>
            <input 
              type="file" 
              accept=".csv"
              onChange={(e) => setArquivo(e.target.files ? e.target.files[0] : null)}
              style={{ padding: '10px', color: 'white' }}
            />
          </Box>
        )}

        {fase === 'PREVIEW' && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip label={`${qtdProntos} Prontos para Inserir`} color="success" />
              <Chip label={`${qtdColisoes} Duplicatas Detectadas`} color="warning" />
              <Chip label={`${qtdErros} Erros de Validação`} color="error" />
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
              As duplicatas e erros serão ignorados durante a importação. Apenas as linhas verdes serão efetivadas.
            </Typography>

            <TableContainer component={Paper} sx={{ backgroundColor: 'rgba(255,255,255,0.05)', maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: '#050f19', color: '#00E5FF' }}>Linha</TableCell>
                    <TableCell sx={{ backgroundColor: '#050f19', color: '#00E5FF' }}>Nome</TableCell>
                    <TableCell sx={{ backgroundColor: '#050f19', color: '#00E5FF' }}>Tipo</TableCell>
                    <TableCell sx={{ backgroundColor: '#050f19', color: '#00E5FF' }}>Status</TableCell>
                    <TableCell sx={{ backgroundColor: '#050f19', color: '#00E5FF' }}>Mensagem</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultados.map((res, i) => (
                    <TableRow key={i} sx={{ backgroundColor: res.status === 'PRONTO' ? 'rgba(46, 125, 50, 0.2)' : res.status === 'COLISAO' ? 'rgba(237, 108, 2, 0.2)' : 'rgba(211, 47, 47, 0.2)' }}>
                      <TableCell sx={{ color: 'white' }}>{res.linha}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{res.dados.nome}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{res.dados.tipo}</TableCell>
                      <TableCell>
                        <Chip size="small" label={res.status} color={res.status === 'PRONTO' ? 'success' : res.status === 'COLISAO' ? 'warning' : 'error'} />
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontSize: '0.85rem' }}>{res.mensagem}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {fase === 'CONCLUIDO' && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main" gutterBottom>
              ✅ Importação Finalizada!
            </Typography>
            <Typography>{mensagemGlobal}</Typography>
          </Box>
        )}

      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {fase === 'UPLOAD' && (
          <>
            <Button onClick={resetar} sx={{ color: 'white' }}>Cancelar</Button>
            <Button 
              variant="contained" 
              onClick={handleUpload} 
              disabled={!arquivo || loading}
              sx={{ backgroundColor: '#00E5FF', color: '#050f19' }}
            >
              {loading ? 'Processando...' : 'Fazer Preview'}
            </Button>
          </>
        )}
        
        {fase === 'PREVIEW' && (
          <>
            <Button onClick={resetar} sx={{ color: 'white' }}>Cancelar</Button>
            <Button 
              variant="contained" 
              onClick={handleConfirmar} 
              disabled={loading || qtdProntos === 0}
              sx={{ backgroundColor: '#00E5FF', color: '#050f19' }}
            >
              {loading ? 'Salvando...' : `Importar ${qtdProntos} Registros Inéditos`}
            </Button>
          </>
        )}

        {fase === 'CONCLUIDO' && (
          <Button variant="contained" onClick={resetar} sx={{ backgroundColor: '#00E5FF', color: '#050f19' }}>
            Fechar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
