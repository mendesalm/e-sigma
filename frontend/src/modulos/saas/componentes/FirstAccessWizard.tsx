import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Typography, Box, CircularProgress, TextField, Stepper, Step, StepLabel,
  FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemButton, ListItemText,
  Divider
} from '@mui/material';
import { api } from '../../../compartilhado/api/cliente_http';
import { useSnackbar } from 'notistack';

interface Props {
  open: boolean;
  onClose: () => void;
}

const steps = ['Potência', 'Loja', 'CIM', 'Confirmação'];

const FirstAccessWizard: React.FC<Props> = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Step 0: Potência (Top Level)
  const [obediences, setObediences] = useState<{id: number, name: string}[]>([]);
  const [selectedObedienceId, setSelectedObedienceId] = useState<string>('');
  const [customObedienceName, setCustomObedienceName] = useState('');

  // Step 0.5: Subpotência (Conditional)
  const [subObediences, setSubObediences] = useState<{id: number, name: string}[]>([]);
  const [selectedSubObedienceId, setSelectedSubObedienceId] = useState<string>('');
  const [isSubpotencyStepActive, setIsSubpotencyStepActive] = useState(false);

  // Step 1: Loja (Search)
  const [searchQuery, setSearchQuery] = useState('');
  const [lodges, setLodges] = useState<{id: number, lodge_name: string, lodge_number: string}[]>([]);
  const [selectedLodgeId, setSelectedLodgeId] = useState<string>('');
  const [customLodgeName, setCustomLodgeName] = useState('');
  const [customLodgeNumber, setCustomLodgeNumber] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Step 2: CIM
  const [cim, setCim] = useState('');

  // Step 3: Registration / Confirmation
  const [status, setStatus] = useState<'PRE_REGISTERED' | 'NOT_FOUND' | 'UPDATE_EMAIL' | null>(null);
  const [emailHint, setEmailHint] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  
  // States for UPDATE_EMAIL
  const [birthDate, setBirthDate] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [degree, setDegree] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (open && activeStep === 0 && obediences.length === 0) {
      fetchTopLevelObediences();
    }
  }, [open, activeStep]);

  useEffect(() => {
    if (selectedObedienceId && selectedObedienceId !== 'OTHER') {
      fetchSubObediences(parseInt(selectedObedienceId));
    } else {
      setSubObediences([]);
      setIsSubpotencyStepActive(false);
      setSelectedSubObedienceId('');
    }
  }, [selectedObedienceId]);

  const fetchTopLevelObediences = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/obediences?only_top_level=true');
      setObediences(response.data);
    } catch (error) {
      enqueueSnackbar('Erro ao buscar obediências', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubObediences = async (parentId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/auth/obediences?parent_id=${parentId}`);
      if (response.data && response.data.length > 0) {
        setSubObediences(response.data);
        setIsSubpotencyStepActive(true);
      } else {
        setSubObediences([]);
        setIsSubpotencyStepActive(false);
      }
    } catch (error) {
      enqueueSnackbar('Erro ao buscar subpotências', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const searchLodges = async () => {
    if (!searchQuery) {
      enqueueSnackbar('Digite o número ou nome da loja para buscar', { variant: 'warning' });
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    setSelectedLodgeId('');
    try {
      const targetObedienceId = selectedSubObedienceId && selectedSubObedienceId !== 'OTHER' 
        ? selectedSubObedienceId 
        : selectedObedienceId;
        
      let endpoint = `/lodges?search=${searchQuery}`;
      if (targetObedienceId && targetObedienceId !== 'OTHER') {
        endpoint += `&obedience_id=${targetObedienceId}`;
      }
      
      const response = await api.get(endpoint);
      setLodges(response.data);
      if (response.data.length === 1) {
        setSelectedLodgeId(String(response.data[0].id));
        setActiveStep(2); // Auto advance to CIM
      }
    } catch (error) {
      enqueueSnackbar('Erro ao buscar lojas', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!selectedObedienceId) return;
      if (selectedObedienceId === 'OTHER' && !customObedienceName) {
        enqueueSnackbar('Informe o nome da sua Potência.', { variant: 'warning' });
        return;
      }
      
      if (isSubpotencyStepActive && selectedObedienceId !== 'OTHER') {
        // Pseudo step 0.5 for Subpotency UI flow mapping to same stepper
        // To keep Stepper at 4 steps visually, we can handle it inline in step 0 or 1
        if (!selectedSubObedienceId) {
           enqueueSnackbar('Selecione uma Subpotência ou "Não se aplica".', { variant: 'warning' });
           return;
        }
      }
      setActiveStep(1);
      
    } else if (activeStep === 1) {
      if (!selectedLodgeId && selectedObedienceId !== 'OTHER') return;
      if ((selectedLodgeId === 'OTHER' || selectedObedienceId === 'OTHER') && !customLodgeName) {
        enqueueSnackbar('Informe o nome da sua Loja.', { variant: 'warning' });
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!cim) return;
      setLoading(true);
      try {
        const obedienceIdToSubmit = selectedSubObedienceId && selectedSubObedienceId !== 'OTHER' ? parseInt(selectedSubObedienceId) : 
                                    selectedObedienceId !== 'OTHER' ? parseInt(selectedObedienceId) : null;
                                    
        const payload = {
          cim,
          obedience_id: obedienceIdToSubmit,
          lodge_id: selectedLodgeId && selectedLodgeId !== 'OTHER' ? parseInt(selectedLodgeId) : null,
        };
        const response = await api.post('/auth/first-access/verify', payload);
        setStatus(response.data.status);
        setEmailHint(response.data.email_hint || '');
        setVerifyMessage(response.data.message);
        setActiveStep(3);
      } catch (error) {
        enqueueSnackbar('Erro ao verificar o CIM. Verifique se os dados estão corretos.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 3) {
      setLoading(true);
      try {
        const obedienceIdToSubmit = selectedSubObedienceId && selectedSubObedienceId !== 'OTHER' ? parseInt(selectedSubObedienceId) : 
                                    selectedObedienceId !== 'OTHER' ? parseInt(selectedObedienceId) : null;

        if (status === 'PRE_REGISTERED') {
          await api.post('/auth/first-access/confirm-pre-registration', {
            cim,
            email: confirmEmail,
            obedience_id: obedienceIdToSubmit,
            lodge_id: selectedLodgeId && selectedLodgeId !== 'OTHER' ? parseInt(selectedLodgeId) : null,
          });
          enqueueSnackbar('Senha enviada para o seu e-mail!', { variant: 'success' });
          onClose();
        } else if (status === 'UPDATE_EMAIL') {
          await api.post('/auth/first-access/update-email', {
            cim,
            new_email: newEmail,
            birth_date: birthDate,
            obedience_id: obedienceIdToSubmit,
            lodge_id: selectedLodgeId && selectedLodgeId !== 'OTHER' ? parseInt(selectedLodgeId) : null,
          });
          enqueueSnackbar('E-mail atualizado e nova senha enviada!', { variant: 'success' });
          onClose();
        } else if (status === 'NOT_FOUND') {
          await api.post('/auth/first-access/register', {
            cim,
            full_name: fullName,
            email,
            degree,
            phone,
            obedience_id: obedienceIdToSubmit,
            obedience_name: selectedObedienceId === 'OTHER' ? customObedienceName : null,
            lodge_id: selectedLodgeId !== 'OTHER' ? parseInt(selectedLodgeId) : null,
            lodge_name: (selectedLodgeId === 'OTHER' || selectedObedienceId === 'OTHER') ? customLodgeName : null,
            lodge_number: customLodgeNumber ? parseInt(customLodgeNumber, 10) : null
          });
          enqueueSnackbar('Solicitação enviada com sucesso!', { variant: 'success' });
          onClose();
        }
      } catch (error: any) {
        enqueueSnackbar(error.response?.data?.detail || 'Erro ao processar solicitação.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const isNextDisabled = () => {
    if (loading) return true;
    if (activeStep === 0 && !selectedObedienceId) return true;
    if (activeStep === 0 && isSubpotencyStepActive && !selectedSubObedienceId) return true;
    if (activeStep === 1 && selectedObedienceId !== 'OTHER' && !selectedLodgeId) return true;
    if (activeStep === 2 && !cim) return true;
    if (activeStep === 3 && status === 'PRE_REGISTERED' && !confirmEmail) return true;
    if (activeStep === 3 && status === 'UPDATE_EMAIL' && (!birthDate || !newEmail)) return true;
    if (activeStep === 3 && status === 'NOT_FOUND' && (!fullName || !email || !degree)) return true;
    return false;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Primeiro Acesso</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box display="flex" flexDirection="column" gap={3}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="body1">
                Para começar, selecione a sua Potência.
              </Typography>
              {loading && obediences.length === 0 ? (
                <Box display="flex" justifyContent="center"><CircularProgress size={24} /></Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Potência Principal</InputLabel>
                  <Select
                    value={selectedObedienceId}
                    label="Potência Principal"
                    onChange={(e) => setSelectedObedienceId(e.target.value)}
                  >
                    {obediences.map((ob) => (
                      <MenuItem key={ob.id} value={String(ob.id)}>{ob.name}</MenuItem>
                    ))}
                    <MenuItem value="OTHER">Minha Potência não está na lista / Outra</MenuItem>
                  </Select>
                </FormControl>
              )}
              {selectedObedienceId === 'OTHER' && (
                <TextField
                  label="Qual o nome da sua Potência?"
                  value={customObedienceName}
                  onChange={(e) => setCustomObedienceName(e.target.value)}
                  fullWidth
                  helperText="Ao prosseguir, sua solicitação de cadastro passará por moderação."
                />
              )}
            </Box>

            {isSubpotencyStepActive && selectedObedienceId !== 'OTHER' && (
              <Box display="flex" flexDirection="column" gap={2} mt={1}>
                <Divider />
                <Typography variant="body1" mt={1}>
                  A potência selecionada possui Subpotências. Selecione abaixo:
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Subpotência (Estadual/Regional)</InputLabel>
                  <Select
                    value={selectedSubObedienceId}
                    label="Subpotência (Estadual/Regional)"
                    onChange={(e) => setSelectedSubObedienceId(e.target.value)}
                  >
                    {subObediences.map((sub) => (
                      <MenuItem key={sub.id} value={String(sub.id)}>{sub.name}</MenuItem>
                    ))}
                    <MenuItem value="OTHER">Não se aplica / Nenhuma</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        )}

        {activeStep === 1 && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body1">
              Agora, informe a sua Loja.
            </Typography>
            {selectedObedienceId === 'OTHER' ? (
              <>
                <TextField label="Nome da Loja" value={customLodgeName} onChange={(e) => setCustomLodgeName(e.target.value)} fullWidth />
                <TextField label="Nº da Loja" type="number" value={customLodgeNumber} onChange={(e) => setCustomLodgeNumber(e.target.value)} fullWidth />
              </>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" gap={1}>
                  <TextField 
                    label="Busque pelo Nome ou Número da Loja" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    fullWidth 
                  />
                  <Button variant="outlined" onClick={searchLodges} disabled={loading || !searchQuery}>
                    {loading ? <CircularProgress size={20} /> : 'Buscar'}
                  </Button>
                </Box>
                
                {hasSearched && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="textSecondary" mb={1}>Resultados:</Typography>
                    {lodges.length > 0 ? (
                      <List sx={{ border: '1px solid #e0e0e0', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                        {lodges.map((lg) => (
                          <ListItem key={lg.id} disablePadding>
                            <ListItemButton selected={selectedLodgeId === String(lg.id)} onClick={() => {
                              setSelectedLodgeId(String(lg.id));
                              setActiveStep(2); // Auto advance
                            }}>
                              <ListItemText 
                                primary={lg.lodge_number ? `${lg.lodge_name} nº ${lg.lodge_number}` : lg.lodge_name} 
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <>
                        <Typography variant="body2" color="error">Nenhuma loja encontrada para esta busca.</Typography>
                        <Box mt={2}>
                           <Button 
                             color="secondary" 
                             variant={selectedLodgeId === 'OTHER' ? 'contained' : 'outlined'} 
                             fullWidth
                             onClick={() => setSelectedLodgeId('OTHER')}
                           >
                             Minha Loja não foi encontrada
                           </Button>
                        </Box>
                      </>
                    )}
                  </Box>
                )}

                {selectedLodgeId === 'OTHER' && (
                  <Box mt={2} display="flex" flexDirection="column" gap={2}>
                    <TextField label="Nome da Loja" value={customLodgeName} onChange={(e) => setCustomLodgeName(e.target.value)} fullWidth />
                    <TextField label="Nº da Loja" type="number" value={customLodgeNumber} onChange={(e) => setCustomLodgeNumber(e.target.value)} fullWidth />
                    <Typography variant="caption" color="text.secondary">Sua solicitação passará por moderação.</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {activeStep === 2 && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body1">
              Informe o seu CIM (Cadastro Individual Maçônico).
            </Typography>
            <TextField
              label="Seu CIM"
              value={cim}
              onChange={(e) => setCim(e.target.value)}
              fullWidth
            />
          </Box>
        )}

        {activeStep === 3 && status === 'PRE_REGISTERED' && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body1" color="success.main">
              {verifyMessage}
            </Typography>
            {emailHint && (
              <Typography variant="body2" color="text.secondary">
                Dica de e-mail atual: {emailHint}
              </Typography>
            )}
            <TextField
              label="Confirme seu E-mail"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              fullWidth
            />
            <Button 
              variant="text" 
              color="secondary" 
              onClick={() => setStatus('UPDATE_EMAIL')}
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            >
              Não tenho mais acesso a este e-mail
            </Button>
          </Box>
        )}

        {activeStep === 3 && status === 'UPDATE_EMAIL' && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body1" color="primary.main">
              Atualização de Segurança
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Para redefinir o e-mail, precisamos confirmar a sua Data de Nascimento conforme registrada na sua ficha cadastral.
            </Typography>
            <TextField
              label="Novo E-mail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Data de Nascimento"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Button 
              variant="text" 
              color="inherit" 
              onClick={() => setStatus('PRE_REGISTERED')}
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            >
              Voltar para e-mail anterior
            </Button>
          </Box>
        )}

        {activeStep === 3 && status === 'NOT_FOUND' && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body1" color="primary.main">
              {verifyMessage}
            </Typography>
            <TextField label="Nome Completo" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth />
            <TextField label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
            <TextField label="Grau" value={degree} onChange={(e) => setDegree(e.target.value)} fullWidth />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        {activeStep > 0 && <Button onClick={handleBack} disabled={loading}>Voltar</Button>}
        <Button onClick={handleNext} variant="contained" color="primary" disabled={isNextDisabled()}>
          {loading ? <CircularProgress size={24} /> : (activeStep === steps.length - 1 ? 'Concluir' : 'Próximo')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FirstAccessWizard;
