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
  
  const obedienciaSelecionada = todasOrganizacoes.find(o => o.id === obedienciaRaiz);
  const classObeSelecionada = obedienciaSelecionada?.dados_especificos?.classificacao || '';

  useEffect(() => {
    if (org) {
      // Ensure we merge root fields that might be modified
      setFormData({
        ...org.dados_especificos,
        nome: org.nome,
        sigla: org.sigla,
        cnpj: org.cnpj
      });
      
      if ((org.tipo === 'LOJA' || org.tipo === 'SUBOBEDIENCIA' || formData.classificacao === 'Jurisdição') && org.organizacao_superior_id) {
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
    
    if ((org.tipo === 'LOJA' || org.tipo === 'SUBOBEDIENCIA' || formData.classificacao === 'Jurisdição') && !obedienciaRaiz) {
      alert("A seleção de uma Federação/Confederação (Mãe) é obrigatória para esta organização.");
      setLoading(false);
      return;
    }
    
    if (org.tipo === 'LOJA' && classObeSelecionada === 'Federação' && !subobediencia) {
      alert("Lojas federadas exigem a seleção de uma Jurisdição (Subobediência).");
      setLoading(false);
      return;
    }

    try {
      const { nome, sigla, cnpj, ...dados_especificos } = formData;
      
      let orgSuperiorId = org.organizacao_superior_id;
      if (org.tipo === 'LOJA') {
        orgSuperiorId = subobediencia || obedienciaRaiz || null;
      } else if (org.tipo === 'SUBOBEDIENCIA' || formData.classificacao === 'Jurisdição') {
        orgSuperiorId = obedienciaRaiz || null;
      }

      const payload = {
        nome,
        sigla,
        cnpj,
        dados_especificos,
        organizacao_superior_id: orgSuperiorId
      };

      if (org.id === 'novo') {
        await axios.post(`http://localhost:8000/api/v1/organizacoes/`, payload);
      } else {
        await axios.patch(`http://localhost:8000/api/v1/organizacoes/${org.id}`, payload);
      }
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!window.confirm("Você será redirecionado para o Stripe para assinar o plano. Deseja continuar?")) return;
    setLoading(true);
    try {
      const resp = await axios.post(`http://localhost:8000/api/v1/saas/checkout/${org.id}`);
      if (resp.data.url) {
        window.location.href = resp.data.url;
      }
    } catch (error) {
      console.error("Erro ao gerar checkout:", error);
      alert("Erro ao conectar com o gateway de pagamento.");
      setLoading(false);
    }
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      color: 'white',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
      '&:hover fieldset': { borderColor: '#00E5FF' },
      '&.Mui-focused fieldset': { borderColor: '#00E5FF' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#00E5FF' },
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: 'rgba(5, 15, 25, 0.95)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white',
          borderRadius: 16
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#00E5FF', fontWeight: 'bold' }}>
        Editar Organização: {org.nome}
      </DialogTitle>
      
      <Tabs 
        value={tabValue} 
        onChange={(e, v) => setTabValue(v)}
        textColor="inherit"
        indicatorColor="secondary"
        sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', '& .MuiTabs-indicator': { backgroundColor: '#00E5FF' } }}
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
                  <TextField InputLabelProps={{ shrink: true }} fullWidth label="Título (ex: ARLS)" value={formData.titulo || ''} onChange={e => handleChange('titulo', e.target.value)} sx={textFieldStyles} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField InputLabelProps={{ shrink: true }} fullWidth label="Número" value={formData.numero || ''} onChange={e => handleChange('numero', e.target.value)} sx={textFieldStyles} />
                </Grid>
              </>
            )}
            
            {org.tipo !== 'LOJA' && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth sx={textFieldStyles}>
                  <InputLabel shrink>Classificação</InputLabel>
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
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Nome" value={formData.nome || ''} onChange={e => handleChange('nome', e.target.value)} sx={textFieldStyles} />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Sigla/Número" value={formData.sigla || ''} onChange={e => handleChange('sigla', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="CNPJ" value={formData.cnpj || ''} onChange={e => handleChange('cnpj', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Data de Fundação" type="date" InputLabelProps={{ shrink: true }} value={formData.data_fundacao || ''} onChange={e => handleChange('data_fundacao', e.target.value)} sx={textFieldStyles} />
            </Grid>

            {org.tipo === 'LOJA' && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField InputLabelProps={{ shrink: true }} fullWidth label="Rito Praticado" value={formData.rito || ''} onChange={e => handleChange('rito', e.target.value)} sx={textFieldStyles} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField InputLabelProps={{ shrink: true }} fullWidth label="Dia e Horário das Sessões" value={formData.dia_horario_sessoes || ''} onChange={e => handleChange('dia_horario_sessoes', e.target.value)} sx={textFieldStyles} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth sx={textFieldStyles}>
                    <InputLabel shrink>Periodicidade</InputLabel>
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
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Telefone Oficial" value={formData.telefone || ''} onChange={e => handleChange('telefone', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="E-mail Oficial" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Site Oficial" value={formData.site_oficial || ''} onChange={e => handleChange('site_oficial', e.target.value)} sx={textFieldStyles} />
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Logradouro" value={formData.logradouro || ''} onChange={e => handleChange('logradouro', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Número" value={formData.endereco_numero || ''} onChange={e => handleChange('endereco_numero', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Complemento" value={formData.complemento || ''} onChange={e => handleChange('complemento', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Bairro" value={formData.bairro || ''} onChange={e => handleChange('bairro', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="CEP" value={formData.cep || ''} onChange={e => handleChange('cep', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Cidade" value={formData.cidade || ''} onChange={e => handleChange('cidade', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Estado" value={formData.estado || ''} onChange={e => handleChange('estado', e.target.value)} sx={textFieldStyles} />
            </Grid>
            
            {org.tipo === 'LOJA' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: '#00E5FF', mb: 1 }}>Coordenadas Geográficas (Check-in)</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField InputLabelProps={{ shrink: true }} fullWidth label="Latitude" value={formData.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} sx={textFieldStyles} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField InputLabelProps={{ shrink: true }} fullWidth label="Longitude" value={formData.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} sx={textFieldStyles} />
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        )}

        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Nome do Contato Técnico" value={formData.contato_tecnico_nome || ''} onChange={e => handleChange('contato_tecnico_nome', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Telefone do Contato" value={formData.contato_tecnico_telefone || ''} onChange={e => handleChange('contato_tecnico_telefone', e.target.value)} sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="E-mail do Contato" value={formData.contato_tecnico_email || ''} onChange={e => handleChange('contato_tecnico_email', e.target.value)} sx={textFieldStyles} />
            </Grid>
          </Grid>
        )}

        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>Informações de Sistema (Somente Leitura)</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="UUID (ID Único)" value={org.id} disabled sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Tipo de Assinatura" value={formData.tipo_assinatura || 'Nenhuma (Espelho)'} disabled sx={textFieldStyles} />
            </Grid>
            
            {(org.tipo === 'LOJA' || org.tipo === 'SUBOBEDIENCIA' || formData.classificacao === 'Jurisdição') && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={textFieldStyles}>
                    <InputLabel shrink>Federação/Confederação (Mãe)</InputLabel>
                    <Select
                      value={obedienciaRaiz}
                      label="Federação/Confederação (Mãe)"
                      onChange={(e) => {
                        setObedienciaRaiz(e.target.value);
                        setSubobediencia(''); 
                      }}
                    >
                      <MenuItem value=""><em>Nenhuma / Selecione</em></MenuItem>
                      {todasOrganizacoes
                        .filter(o => o.tipo === 'OBEDIENCIA')
                        .sort((a,b) => a.nome.localeCompare(b.nome))
                        .map(ob => (
                          <MenuItem key={ob.id} value={ob.id}>{ob.nome}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {org.tipo === 'LOJA' && classObeSelecionada === 'Federação' && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth sx={textFieldStyles} disabled={!obedienciaRaiz}>
                      <InputLabel shrink>Jurisdição (Subobediência Obrigatória)</InputLabel>
                      <Select
                        value={subobediencia}
                        label="Jurisdição (Subobediência Obrigatória)"
                        onChange={(e) => setSubobediencia(e.target.value)}
                      >
                        <MenuItem value="" disabled><em>Selecione a jurisdição</em></MenuItem>
                        {todasOrganizacoes
                          .filter(o => o.tipo === 'SUBOBEDIENCIA' && o.organizacao_superior_id === obedienciaRaiz)
                          .sort((a,b) => a.nome.localeCompare(b.nome))
                          .map(sub => (
                            <MenuItem key={sub.id} value={sub.id}>{sub.nome}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </>
            )}

            <Grid item xs={12} sm={6}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Webmaster (Gerado pelo Sigma)" value={formData.webmaster || 'Pendente'} disabled sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Data de Criação" value={org.id === 'novo' ? 'Nova' : new Date(org.criado_em).toLocaleDateString()} disabled sx={textFieldStyles} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField InputLabelProps={{ shrink: true }} fullWidth label="Data de Upgrade" value={formData.data_upgrade || 'N/A'} disabled sx={textFieldStyles} />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 2, justifyContent: 'space-between' }}>
        <div>
          {org.id !== 'novo' && !org.cliente_ativo_sigma && (
            <Button 
              variant="outlined" 
              onClick={handleActivate} 
              disabled={loading}
              sx={{ borderColor: '#00E5FF', color: '#00E5FF', mr: 2, '&:hover': { backgroundColor: 'rgba(0, 229, 255, 0.1)' }}}
            >
              🚀 Ativar Assinatura SaaS
            </Button>
          )}
        </div>
        <div>
          <Button onClick={onClose} sx={{ color: 'white' }}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            disabled={loading}
            sx={{ backgroundColor: '#00E5FF', color: '#1E1E2F', '&:hover': { backgroundColor: '#e6c200' }}}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
};
