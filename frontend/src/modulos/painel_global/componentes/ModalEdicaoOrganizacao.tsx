import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Grid, Typography, Box, Chip, Button, TextField, 
  Tabs, Tab, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import axios from 'axios';

interface ModalEdicaoOrganizacaoProps {
  open: boolean;
  onClose: () => void;
  org: any;
  todasOrganizacoes: any[];
  onSaveSuccess: () => void;
}

export const ModalEdicaoOrganizacao: React.FC<ModalEdicaoOrganizacaoProps> = ({ open, onClose, org, todasOrganizacoes, onSaveSuccess }) => {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [obedienciaRaiz, setObedienciaRaiz] = useState<string>('');
  const [subobediencia, setSubobediencia] = useState<string>('');

  useEffect(() => {
    if (org) {
      // Ensure we merge root fields that might be modified
      setFormData({
        ...org.dados_especificos,
        nome: org.nome,
        sigla: org.sigla,
        cnpj: org.cnpj
      });
      
      if (org.tipo === 'LOJA' && org.organizacao_superior_id) {
        const parent = todasOrganizacoes.find(o => o.id === org.organizacao_superior_id);
        if (parent) {
          if (parent.tipo === 'SUBOBEDIENCIA') {
            setObedienciaRaiz(parent.organizacao_superior_id || '');
            setSubobediencia(parent.id);
          } else {
            setObedienciaRaiz(parent.id);
            setSubobediencia('');
          }
        }
      } else {
        setObedienciaRaiz('');
        setSubobediencia('');
      }
      
      setTabValue(0);
    }
  }, [org, todasOrganizacoes]);

  if (!org) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { nome, sigla, cnpj, ...dados_especificos } = formData;
      
      let orgSuperiorId = org.organizacao_superior_id;
      if (org.tipo === 'LOJA') {
        orgSuperiorId = subobediencia || obedienciaRaiz || null;
      }

      const payload = {
        nome,
        sigla,
        cnpj,
        dados_especificos,
        organizacao_superior_id: orgSuperiorId
      };

      await axios.patch(`http://localhost:8000/api/v1/organizacoes/${org.id}`, payload);
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      color: 'white',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
      '&:hover fieldset': { borderColor: '#FFD700' },
      '&.Mui-focused fieldset': { borderColor: '#FFD700' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#FFD700' },
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: 'rgba(30, 30, 47, 0.95)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white',
          borderRadius: 16
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#FFD700', fontWeight: 'bold' }}>
        Editar Organização: {org.nome}
      </DialogTitle>
      
      <Tabs 
        value={tabValue} 
        onChange={(e, v) => setTabValue(v)}
        textColor="inherit"
        indicatorColor="secondary"
        sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', '& .MuiTabs-indicator': { backgroundColor: '#FFD700' } }}
      >
        <Tab label="Dados Básicos" />
        <Tab label="Endereço" />
        <Tab label="Contato Técnico" />
        <Tab label="SaaS & Sistema" />
      </Tabs>

      <DialogContent sx={{ mt: 2, minHeight: '400px' }}>
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {org.tipo === 'LOJA' && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Título (ex: ARLS)" value={formData.titulo || ''} onChange={e => handleChange('titulo', e.target.value)} sx={textFieldStyles} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Número" value={formData.numero || ''} onChange={e => handleChange('numero', e.target.value)} sx={textFieldStyles} />
                </Grid>
              </>
            )}
            
            {org.tipo !== 'LOJA' && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth sx={textFieldStyles}>
                  <InputLabel>Classificação</InputLabel>
                  <Select
                    value={formData.classificacao || ''}
                    label="Classificação"
                    onChange={e => handleChange('classificacao', e.target.value)}
                  >
                    <MenuItem value="Federação">Federação (ex: GOB)</MenuItem>
                    <MenuItem value="Confederação">Confederação (ex: Grandes Lojas)</MenuItem>
                    <MenuItem value="Jurisdição">Jurisdição (ex: Estaduais)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={org.tipo === 'LOJA' ? 4 : 8}>
              <TextField fullWidth label="Nome" value={formData.nome || ''} onChange={e => handleChange('nome', e.target.value)} sx={textFieldStyles} />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Sigla/Número" value={formData.sigla || ''} onChange={e => handleChange('sigla', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="CNPJ" value={formData.cnpj || ''} onChange={e => handleChange('cnpj', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Data de Fundação" type="date" InputLabelProps={{ shrink: true }} value={formData.data_fundacao || ''} onChange={e => handleChange('data_fundacao', e.target.value)} sx={textFieldStyles} />
            </Grid>

            {org.tipo === 'LOJA' && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Rito Praticado" value={formData.rito || ''} onChange={e => handleChange('rito', e.target.value)} sx={textFieldStyles} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Dia e Horário das Sessões" value={formData.dia_horario_sessoes || ''} onChange={e => handleChange('dia_horario_sessoes', e.target.value)} sx={textFieldStyles} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth sx={textFieldStyles}>
                    <InputLabel>Periodicidade</InputLabel>
                    <Select value={formData.periodicidade || ''} label="Periodicidade" onChange={e => handleChange('periodicidade', e.target.value)} sx={{ color: 'white' }}>
                      <MenuItem value="SEMANAL">Semanal</MenuItem>
                      <MenuItem value="QUINZENAL">Quinzenal</MenuItem>
                      <MenuItem value="MENSAL">Mensal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Telefone Oficial" value={formData.telefone || ''} onChange={e => handleChange('telefone', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="E-mail Oficial" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Site Oficial" value={formData.site_oficial || ''} onChange={e => handleChange('site_oficial', e.target.value)} sx={textFieldStyles} />
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Logradouro" value={formData.logradouro || ''} onChange={e => handleChange('logradouro', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Número" value={formData.endereco_numero || ''} onChange={e => handleChange('endereco_numero', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Complemento" value={formData.complemento || ''} onChange={e => handleChange('complemento', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Bairro" value={formData.bairro || ''} onChange={e => handleChange('bairro', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="CEP" value={formData.cep || ''} onChange={e => handleChange('cep', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Cidade" value={formData.cidade || ''} onChange={e => handleChange('cidade', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label="Estado" value={formData.estado || ''} onChange={e => handleChange('estado', e.target.value)} sx={textFieldStyles} />
            </Grid>
            
            {org.tipo === 'LOJA' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#FFD700', mb: 1 }}>Coordenadas Geográficas (Check-in)</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Latitude" value={formData.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} sx={textFieldStyles} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Longitude" value={formData.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} sx={textFieldStyles} />
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        )}

        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nome do Contato Técnico" value={formData.contato_tecnico_nome || ''} onChange={e => handleChange('contato_tecnico_nome', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Telefone do Contato" value={formData.contato_tecnico_telefone || ''} onChange={e => handleChange('contato_tecnico_telefone', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="E-mail do Contato" value={formData.contato_tecnico_email || ''} onChange={e => handleChange('contato_tecnico_email', e.target.value)} sx={textFieldStyles} />
            </Grid>
          </Grid>
        )}

        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>Informações de Sistema (Somente Leitura)</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="UUID (ID Único)" value={org.id} disabled sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Tipo de Assinatura" value={formData.tipo_assinatura || 'Nenhuma (Espelho)'} disabled sx={textFieldStyles} />
            </Grid>
            
            {org.tipo === 'LOJA' && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={textFieldStyles}>
                    <InputLabel>Federação/Confederação (Mãe)</InputLabel>
                    <Select
                      value={obedienciaRaiz}
                      label="Federação/Confederação (Mãe)"
                      onChange={(e) => {
                        setObedienciaRaiz(e.target.value);
                        setSubobediencia(''); // Reseta a subobediência ao trocar a raiz
                      }}
                    >
                      <MenuItem value=""><em>Nenhuma / Independente</em></MenuItem>
                      {todasOrganizacoes
                        .filter(o => o.tipo === 'OBEDIENCIA')
                        .sort((a,b) => a.nome.localeCompare(b.nome))
                        .map(ob => (
                          <MenuItem key={ob.id} value={ob.id}>{ob.nome}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={textFieldStyles} disabled={!obedienciaRaiz}>
                    <InputLabel>Jurisdição (Subobediência)</InputLabel>
                    <Select
                      value={subobediencia}
                      label="Jurisdição (Subobediência)"
                      onChange={(e) => setSubobediencia(e.target.value)}
                    >
                      <MenuItem value=""><em>Direta à Mãe</em></MenuItem>
                      {todasOrganizacoes
                        .filter(o => o.tipo === 'SUBOBEDIENCIA' && o.organizacao_superior_id === obedienciaRaiz)
                        .sort((a,b) => a.nome.localeCompare(b.nome))
                        .map(sub => (
                          <MenuItem key={sub.id} value={sub.id}>{sub.nome}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Webmaster (Gerado pelo Sigma)" value={formData.webmaster || 'Pendente'} disabled sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Data de Criação" value={new Date(org.criado_em).toLocaleDateString()} disabled sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Data de Upgrade" value={formData.data_upgrade || 'N/A'} disabled sx={textFieldStyles} />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2 }}>
        <Button onClick={onClose} sx={{ color: 'white' }}>Cancelar</Button>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          disabled={loading}
          sx={{ backgroundColor: '#FFD700', color: '#1E1E2F', '&:hover': { backgroundColor: '#e6c200' }}}
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
