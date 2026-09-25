import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Divider,
  Alert,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  AccountBalance as CorevmIcon,
  Store as LojasIcon,
  MusicNote as HarmoniaIcon,
  MenuBook as BibliotecaIcon,
  Campaign as ClassificadosIcon,
  OpenInNew,
  CheckCircle,
  BugReport,
  Lightbulb,
  ReceiptLong,
  Payment,
  Shield,
  AdminPanelSettings,
  Logout,
  Brightness4,
  Brightness7,
  Speed,
  CloudDone,
  Send
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../compartilhado/contextos/AuthContext';
import { useCustomTheme } from '../../compartilhado/contextos/ThemeContext';
import { LogoAnimadaSigma } from '../../compartilhado/componentes/LogoAnimadaSigma';
import { useSnackbar } from 'notistack';

// URLs dos módulos satélite para desenvolvimento e produção
const URLS_SATELITES = {
  corevm: import.meta.env.VITE_COREVM_URL || 'http://localhost:5174',
  lojas: import.meta.env.VITE_LOJAS_URL || 'http://localhost:5175',
  harmonia: import.meta.env.VITE_HARMONIA_URL || 'http://localhost:5178',
};

interface ChamadoBug {
  id: string;
  modulo: string;
  titulo: string;
  gravidade: 'Baixa' | 'Média' | 'Alta';
  status: 'Aberto' | 'Em Análise' | 'Resolvido';
  data: string;
}

export const DashboardCliente: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useCustomTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Estado das abas de suporte/evolução
  const [abaSuporte, setAbaSuporte] = useState(0);

  // Estado do formulário de reporte de bug
  const [bugModulo, setBugModulo] = useState('lojas');
  const [bugGravidade, setBugGravidade] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [bugTitulo, setBugTitulo] = useState('');
  const [bugDescricao, setBugDescricao] = useState('');
  const [enviandoBug, setEnviandoBug] = useState(false);

  // Estado do formulário de sugestão
  const [sugestaoModulo, setSugestaoModulo] = useState('lojas');
  const [sugestaoTexto, setSugestaoTexto] = useState('');
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);

  // Lista simulada de chamados para acompanhamento do cliente
  const [chamados, setChamados] = useState<ChamadoBug[]>([
    {
      id: 'BUG-104',
      modulo: 'CoReVM',
      titulo: 'Notificação em tempo real da regional',
      gravidade: 'Média',
      status: 'Resolvido',
      data: '24/09/2026'
    },
    {
      id: 'BUG-105',
      modulo: 'Lojas',
      titulo: 'Formatação de moeda no balancete',
      gravidade: 'Baixa',
      status: 'Em Análise',
      data: '25/09/2026'
    }
  ]);

  const glassCardStyle = {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(19, 27, 41, 0.7)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(16px)',
    border: theme.palette.mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(2, 132, 199, 0.2)',
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px 0 rgba(0, 0, 0, 0.35)' : '0 8px 24px 0 rgba(2, 132, 199, 0.1)',
    borderRadius: 3,
    transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const handleAbrirModulo = (url: string, nomeModulo: string) => {
    enqueueSnackbar(`Direcionando para o módulo ${nomeModulo} com Single Sign-On...`, { variant: 'info' });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmeterBug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitulo.trim() || !bugDescricao.trim()) {
      enqueueSnackbar('Por favor, preencha o título e a descrição do problema.', { variant: 'warning' });
      return;
    }
    setEnviandoBug(true);
    setTimeout(() => {
      const novoChamado: ChamadoBug = {
        id: `BUG-${100 + chamados.length + 1}`,
        modulo: bugModulo.toUpperCase(),
        titulo: bugTitulo,
        gravidade: bugGravidade,
        status: 'Aberto',
        data: new Date().toLocaleDateString('pt-BR')
      };
      setChamados([novoChamado, ...chamados]);
      setBugTitulo('');
      setBugDescricao('');
      setEnviandoBug(false);
      enqueueSnackbar('Chamado registrado com sucesso! Nossa equipe técnica analisará a ocorrência.', { variant: 'success' });
    }, 600);
  };

  const handleSubmeterSugestao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugestaoTexto.trim()) {
      enqueueSnackbar('Por favor, descreva sua ideia ou sugestão.', { variant: 'warning' });
      return;
    }
    setEnviandoSugestao(true);
    setTimeout(() => {
      setSugestaoTexto('');
      setEnviandoSugestao(false);
      enqueueSnackbar('Agradecemos imensamente sua sugestão! Ela foi encaminhada ao conselho de produto.', { variant: 'success' });
    }, 600);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
      {/* Barra Superior / Header do Hub */}
      <Paper
        elevation={2}
        sx={{
          py: 1.5,
          px: { xs: 2, md: 4 },
          borderRadius: 0,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(11, 15, 25, 0.95)' : '#ffffff',
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1400, mx: 'auto' }}>
          {/* Logo e Título */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogoAnimadaSigma theme="ouro" width="100%" height="100%" showText={false} animated={false} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontFamily: "'Tektur', sans-serif", fontWeight: 700, lineHeight: 1.1, color: 'primary.main' }}>
                SiGMa Hub
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                Central do Assinante & Lançador de Módulos
              </Typography>
            </Box>
          </Box>

          {/* Ações do Usuário */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isSuperAdmin && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<AdminPanelSettings />}
                onClick={() => navigate('/global')}
                sx={{ borderRadius: 2, textTransform: 'none', display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Painel SuperAdmin
              </Button>
            )}

            {/* Alternador de Tema */}
            <IconButton onClick={toggleColorMode} color="inherit" size="small" sx={{ border: `1px solid ${theme.palette.divider}` }}>
              {mode === 'dark' ? <Brightness7 sx={{ fontSize: 18, color: '#f59e0b' }} /> : <Brightness4 sx={{ fontSize: 18, color: '#0284c7' }} />}
            </IconButton>

            {/* Identificação do Usuário */}
            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' }, px: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {user?.sub || 'Usuário Autenticado'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {isSuperAdmin ? 'Super Administrador' : (user?.role === 'webmaster' ? 'Gestor de Loja' : 'Obreiro')}
              </Typography>
            </Box>

            {/* Botão Sair */}
            <IconButton onClick={handleLogout} color="error" size="small" title="Encerrar Sessão (Logout)" sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <Logout fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Banner de SuperAdmin (se aplicável) */}
      {isSuperAdmin && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/global')}>
              Acessar Painel Global
            </Button>
          }
          sx={{ borderRadius: 0, borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          Você está visualizando o <strong>Hub do Cliente</strong> como <strong>SuperAdmin</strong>. As permissões de acesso total estão ativas.
        </Alert>
      )}

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* HERO: Resumo da Assinatura e Boas-Vindas */}
        <Paper
          sx={{
            ...glassCardStyle,
            p: { xs: 3, md: 4 },
            mb: 4,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(8, 47, 73, 0.4) 0%, rgba(19, 27, 41, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(224, 242, 254, 0.6) 0%, rgba(255, 255, 255, 0.95) 100%)',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)'
          }}
        >
          <Grid container spacing={3} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Chip
                  icon={<CheckCircle sx={{ fontSize: '16px !important' }} />}
                  label="Assinatura SaaS Ativa"
                  color="success"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  label="Plano Intermediário"
                  variant="outlined"
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontFamily: "'Tektur', sans-serif", fontWeight: 700, color: 'text.primary', mb: 1 }}>
                Portal do Ecossistema SiGMa
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 800, lineHeight: 1.6 }}>
                Selecione o módulo satélite desejado abaixo para abrir seu ambiente de trabalho ou gerencie sua assinatura e suporte centralizado.
              </Typography>
            </Grid>

            {/* Métricas Rápidas da Conta */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(2, 132, 199, 0.05)',
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
                  Resumo da Oficina
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Vencimento da Mensalidade:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>15/10/2026</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Obreiros Cadastrados:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>42 Membros</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Backup em Nuvem:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>Sincronizado</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* SEÇÃO 1: GRID DE LANÇADORES (WIDGETS DOS MÓDULOS SATÉLITE) */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" sx={{ fontFamily: "'Tektur', sans-serif", fontWeight: 600, color: 'text.primary' }}>
              Módulos do Sistema
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Acesso seguro e transparente via Single Sign-On (SSO)
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* WIDGET 1: Módulo Lojas (ERP Principal) */}
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                sx={{
                  ...glassCardStyle,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: theme.palette.mode === 'dark' ? '0 12px 30px rgba(56, 189, 248, 0.25)' : '0 12px 30px rgba(2, 132, 199, 0.2)',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main'
                      }}
                    >
                      <LojasIcon sx={{ fontSize: 30 }} />
                    </Box>
                    <Chip label="Liberado" color="success" size="small" sx={{ fontWeight: 600 }} />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                    Módulo Lojas
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2 }}>
                    ERP completo da Oficina: Cadastro de Obreiros, Sessões, Presenças, Tesouraria, Livro Caixa, Patrimônio e Arquitetura.
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    endIcon={<OpenInNew />}
                    onClick={() => handleAbrirModulo(URLS_SATELITES.lojas, 'Lojas')}
                    sx={{ borderRadius: 2, py: 1 }}
                  >
                    Acessar Lojas
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* WIDGET 2: CoReVM (Conselho Regional) */}
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                sx={{
                  ...glassCardStyle,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    borderColor: '#38bdf8',
                    boxShadow: theme.palette.mode === 'dark' ? '0 12px 30px rgba(56, 189, 248, 0.25)' : '0 12px 30px rgba(2, 132, 199, 0.2)',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 2,
                        bgcolor: alpha('#38bdf8', 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8'
                      }}
                    >
                      <CorevmIcon sx={{ fontSize: 30 }} />
                    </Box>
                    <Chip label="Liberado" color="success" size="small" sx={{ fontWeight: 600 }} />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                    CoReVM (Regional)
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2 }}>
                    Conselho Regional de Veneráveis Mestres: Prévias de Admissão, Atas, Pautas de Reunião, Transmissão de Cargo e Auditoria em Tempo Real.
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    endIcon={<OpenInNew />}
                    onClick={() => handleAbrirModulo(URLS_SATELITES.corevm, 'CoReVM')}
                    sx={{ borderRadius: 2, py: 1 }}
                  >
                    Acessar CoReVM
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* WIDGET 3: Harmonia (Liturgia Ritualística) */}
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                sx={{
                  ...glassCardStyle,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    borderColor: '#a855f7',
                    boxShadow: '0 12px 30px rgba(168, 85, 247, 0.2)',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 2,
                        bgcolor: alpha('#a855f7', 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a855f7'
                      }}
                    >
                      <HarmoniaIcon sx={{ fontSize: 30 }} />
                    </Box>
                    <Chip label="Liberado" color="secondary" size="small" sx={{ fontWeight: 600 }} />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                    Módulo Harmonia
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2 }}>
                    Player litúrgico com repertório orquestrado para todos os ritos maçônicos (REAA, Moderno, York, Schröder).
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    endIcon={<OpenInNew />}
                    onClick={() => handleAbrirModulo(URLS_SATELITES.harmonia, 'Harmonia')}
                    sx={{ borderRadius: 2, py: 1 }}
                  >
                    Acessar Harmonia
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* SEÇÃO 2: DETALHES DA ASSINATURA & FINANCEIRO */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" sx={{ fontFamily: "'Tektur', sans-serif", fontWeight: 600, color: 'text.primary', mb: 3 }}>
            Detalhes da Assinatura & Pagamentos
          </Typography>

          <Grid container spacing={3}>
            {/* Card de Faturamento */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ ...glassCardStyle, p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Payment color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Dados de Cobrança
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Plano Contratado:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>Intermediário (Anual)</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Valor da Mensalidade:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>R$ 90,00 / mês</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Método Principal:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>PIX Recorrente / Boleto</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Status Financeiro:</Typography>
                  <Chip label="Em Dia" color="success" size="small" sx={{ fontWeight: 700 }} />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button variant="outlined" size="small" startIcon={<ReceiptLong />} sx={{ borderRadius: 2 }}>
                    Segunda Via / Faturas
                  </Button>
                  <Button variant="contained" size="small" sx={{ borderRadius: 2 }}>
                    Alterar Plano
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Card de Recursos e Infraestrutura */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ ...glassCardStyle, p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <CloudDone color="success" />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Armazenamento & Recursos da Nuvem
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Espaço em Nuvem:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>1.4 GB de 10 GB usados</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Instância Isolada:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>Multi-Tenant Seguro (Instância Dedicada)</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Criptografia em Repouso:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>Ativa (AES-256)</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Disponibilidade do SLA:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>99.9% Uptime</Typography>
                </Box>

                <Alert severity="success" icon={<Shield fontSize="inherit" />} sx={{ mt: 2, borderRadius: 2 }}>
                  Seus dados estão protegidos com backups automáticos diários e isolamento de tenant.
                </Alert>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* SEÇÃO 3: CANAL DE ATENDIMENTO, REPORTE DE BUGS & SUGESTÕES */}
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ ...glassCardStyle, p: { xs: 2.5, md: 4 } }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={abaSuporte} onChange={(_, val) => setAbaSuporte(val)}>
                <Tab icon={<BugReport />} iconPosition="start" label="Reportar Bug ou Inconsistência" sx={{ textTransform: 'none', fontWeight: 600 }} />
                <Tab icon={<Lightbulb />} iconPosition="start" label="Enviar Sugestão de Melhoria" sx={{ textTransform: 'none', fontWeight: 600 }} />
                <Tab icon={<ReceiptLong />} iconPosition="start" label="Meus Chamados de Suporte" sx={{ textTransform: 'none', fontWeight: 600 }} />
              </Tabs>
            </Box>

            {/* ABA 0: REPORTE DE BUG */}
            {abaSuporte === 0 && (
              <Box component="form" onSubmit={handleSubmeterBug}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                  Encontrou alguma anomalia ou problema no sistema?
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Preencha o formulário abaixo para abrir um chamado diretamente com a equipe de engenharia do SiGMa.
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Módulo Afetado"
                      value={bugModulo}
                      onChange={(e) => setBugModulo(e.target.value)}
                    >
                      <MenuItem value="e-sigma">e-Sigma (Identidade & Login)</MenuItem>
                      <MenuItem value="lojas">Lojas (Secretaria, Tesouraria, Obreiros)</MenuItem>
                      <MenuItem value="corevm">CoReVM (Conselho Regional)</MenuItem>
                      <MenuItem value="harmonia">Harmonia (Música)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Gravidade"
                      value={bugGravidade}
                      onChange={(e) => setBugGravidade(e.target.value as any)}
                    >
                      <MenuItem value="Baixa">Baixa (Pequeno detalhe visual ou de texto)</MenuItem>
                      <MenuItem value="Média">Média (Função com comportamento inesperado)</MenuItem>
                      <MenuItem value="Alta">Alta (Impede a execução de uma rotina importante)</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Título do Ocorrido"
                      placeholder="Ex: Erro ao emitir recibo na tesouraria do Lojas"
                      value={bugTitulo}
                      onChange={(e) => setBugTitulo(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Descrição Detalhada do Problema"
                      placeholder="Descreva o que você estava fazendo, o que aconteceu e qualquer mensagem de erro que tenha surgido..."
                      value={bugDescricao}
                      onChange={(e) => setBugDescricao(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={enviandoBug}
                      startIcon={<Send />}
                      sx={{ borderRadius: 2, px: 4, py: 1 }}
                    >
                      {enviandoBug ? 'Enviando Ocorrência...' : 'Registrar Chamado'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* ABA 1: ENVIAR SUGESTÃO */}
            {abaSuporte === 1 && (
              <Box component="form" onSubmit={handleSubmeterSugestao}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                  Ideias e Sugestões para o Ecossistema SiGMa
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  Sua experiência nas oficinas é o motor da evolução do software. Conte-nos como podemos aprimorar sua rotina!
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Módulo para a Ideia"
                      value={sugestaoModulo}
                      onChange={(e) => setSugestaoModulo(e.target.value)}
                    >
                      <MenuItem value="geral">Geral / Novo Módulo</MenuItem>
                      <MenuItem value="lojas">Módulo Lojas</MenuItem>
                      <MenuItem value="corevm">Módulo CoReVM</MenuItem>
                      <MenuItem value="harmonia">Módulo Harmonia</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Sua Sugestão de Melhoria"
                      placeholder="Ex: Seria muito prático se pudéssemos exportar a lista de presenças em formato de planilha Excel personalizada..."
                      value={sugestaoTexto}
                      onChange={(e) => setSugestaoTexto(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={enviandoSugestao}
                      startIcon={<Send />}
                      sx={{ borderRadius: 2, px: 4, py: 1 }}
                    >
                      {enviandoSugestao ? 'Enviando Ideia...' : 'Enviar Sugestão Fraternal'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* ABA 2: LISTA DE CHAMADOS */}
            {abaSuporte === 2 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                  Histórico de Chamados
                </Typography>
                {chamados.map((item) => (
                  <Paper
                    key={item.id}
                    sx={{
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${theme.palette.divider}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          [{item.id}] {item.titulo}
                        </Typography>
                        <Chip label={item.modulo} size="small" variant="outlined" />
                        <Chip
                          label={item.gravidade}
                          size="small"
                          color={item.gravidade === 'Alta' ? 'error' : (item.gravidade === 'Média' ? 'warning' : 'default')}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Registrado em: {item.data}
                      </Typography>
                    </Box>

                    <Chip
                      label={item.status}
                      color={item.status === 'Resolvido' ? 'success' : (item.status === 'Em Análise' ? 'warning' : 'info')}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};
