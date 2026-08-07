import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Grid, Paper, IconButton, SvgIcon, Dialog, DialogTitle, DialogContent, DialogActions, TextField, useTheme } from '@mui/material';
import type { SvgIconProps } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { People, Security, AccountBalance, Extension, AutoAwesome, Restaurant, MenuBook, MusicNote, Storefront, Campaign, ArrowForwardIos, ArrowBackIosNew } from '@mui/icons-material';
import { LogoAnimadaSigma } from '../../compartilhado/componentes/LogoAnimadaSigma';
import SecretariaIcon from '../../assets/icons/Secretaria.svg';
import ChancelariaIcon from '../../assets/icons/chancelaria.svg';
import TesourariaIcon from '../../assets/icons/Tesouraria.svg';
import HarmoniaIcon from '../../assets/icons/Harmonia.svg';
import BibliotecaIcon from '../../assets/icons/Biblioteca.svg';
import BarIcon from '../../assets/icons/Bar.svg';
import ArquitetoIcon from '../../assets/icons/Arquiteto.svg';
import OradorIcon from '../../assets/icons/Orador.svg';
import ClassificadosIcon from '../../assets/icons/Classificados.svg';
import ComunicacaoIcon from '../../assets/icons/Comunicacao.svg';
import seloIcon from '../../assets/icons/selo.png';
import Rodape from '../../compartilhado/layouts/Rodape';
import { Cabecalho } from '../../compartilhado/layouts/Cabecalho';
import FundoHero from './FundoHero';
import FundoRecursos from './FundoRecursos';

const SectionContainer: React.FC<{ children: React.ReactNode, id?: string }> = ({ children, id }) => (
  <Box
    id={id}
    sx={{
      minHeight: '100vh',
      width: '100%',
      scrollSnapAlign: 'start',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      zIndex: 1,
      px: { xs: 2, md: 8 },
      pt: { xs: '80px', md: '100px' },
      pb: 4
    }}
  >
    {children}
  </Box>
);

export const PaginaAterrissagem: React.FC = () => {
  const theme = useTheme();

  const glassStyle = {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(19, 27, 41, 0.5)' : 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(20px)',
    border: theme.palette.mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.15)' : '1px solid rgba(2, 132, 199, 0.15)',
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)' : '0 8px 32px 0 rgba(2, 132, 199, 0.1)',
    borderRadius: 4,
    p: 4,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: theme.palette.mode === 'dark' ? '0 12px 40px 0 rgba(56, 189, 248, 0.2)' : '0 12px 40px 0 rgba(2, 132, 199, 0.2)',
      borderColor: theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.4)',
    }
  };

  const [showSelo, setShowSelo] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [openContact, setOpenContact] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleOpenContact = (plan: string) => {
    setSelectedPlan(plan);
    setOpenContact(true);
  };

  const handleContactSubmit = () => {
    const subject = `Solicitação de Plano - ${selectedPlan}`;
    const body = `Nome/Responsável: ${contactForm.name}\nEmail: ${contactForm.email}\nTelefone: ${contactForm.phone}\n\nMensagem/Detalhes:\n${contactForm.message}`;
    window.location.href = `mailto:contato@e-sigma.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpenContact(false);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    setLastInteraction(prev => prev + 1);
    if (carouselRef.current) {
      const isDesktop = window.innerWidth > 900;
      const scrollAmount = isDesktop ? carouselRef.current.clientWidth / 3 : carouselRef.current.clientWidth;
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Drag and Drop (Swipe) Carousel Logic
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(0);

  // Auto-scroll loop
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDragging && carouselRef.current) {
        const isDesktop = window.innerWidth > 900;
        const scrollAmount = isDesktop ? carouselRef.current.clientWidth / 3 : carouselRef.current.clientWidth;
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        setLastInteraction(prev => prev + 1);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastInteraction, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setLastInteraction(Date.now());
    if (!carouselRef.current) return;
    setIsDragging(true);
    carouselRef.current.style.scrollSnapType = 'none';
    carouselRef.current.style.scrollBehavior = 'auto';
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
    if (carouselRef.current) {
      carouselRef.current.style.scrollSnapType = 'x mandatory';
      carouselRef.current.style.scrollBehavior = 'smooth';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Velocidade do arraste
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollToSection = (id: string) => {
    const container = document.getElementById('landing-container');
    const el = document.getElementById(id);
    if (container && el) {
      container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    }
  };

  // Animações de Fundo agora são tratadas por componentes isolados


  return (
    <>
      <Cabecalho />
      <Box
        id="landing-container"
        sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
        m: 0,
        p: 0,
        bgcolor: 'background.default'
      }}
      onScroll={(e) => {
        const target = e.target as HTMLElement;
        const currentScroll = target.scrollTop;
        const windowHeight = window.innerHeight;
        
        window.dispatchEvent(new CustomEvent('landing-scroll', { detail: currentScroll }));
        window.dispatchEvent(new CustomEvent('landing-scroll', { detail: currentScroll }));

        // Floating seal logic: Show only between Hero and Rodape
        const isPastHero = currentScroll > windowHeight * 0.3;
        const isBeforeRodape = currentScroll < windowHeight * 3.2;
        const shouldShow = isPastHero && isBeforeRodape;
        
        if (showSelo !== shouldShow) {
          setShowSelo(shouldShow);
        }
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Tektur:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />

      {/* SECTION 1: HERO */}
      <SectionContainer id="hero-section">
        <FundoHero />
        <Box sx={{ textAlign: 'center', width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box id="hero-logo" sx={{ mt: 5, filter: 'drop-shadow(0 0 30px rgba(0,176,255,0.4))', display: 'flex', justifyContent: 'center' }}>
            <LogoAnimadaSigma theme="cyber" width={220} height={220} showText={false} animated={false} />
          </Box>
          <Box sx={{ mt: 3, mb: 5 }}>
              <Typography
                variant="h1"
                sx={{
                  fontFamily: "'Tektur', sans-serif",
                  fontWeight: 600,
                  fontSize: { xs: '28px', sm: '38px', md: '50px' },
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(to bottom, #e0f2fe 0%, #38bdf8 50%, #082f49 100%)'
                    : 'linear-gradient(to bottom, #0f172a 0%, #0284c7 60%, #0ea5e9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: theme.palette.mode === 'dark' 
                    ? 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.5))' 
                    : 'drop-shadow(0 4px 6px rgba(2, 132, 199, 0.2))',
                  lineHeight: 1.2
                }}
              >
                Sistema Integrado de<br />Gerenciamento Maçônico
              </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7', 
                mt: 3, 
                fontFamily: "'Inter', sans-serif", 
                fontWeight: 400,
                fontSize: { xs: '1.1rem', md: '1.3rem' }
              }}
            >
              Uma plataforma integrada, inteligente e descomplicada
            </Typography>
          </Box>
          <Box sx={{ width: '100%' }}>
            <Paper sx={{ ...glassStyle, mx: 'auto', p: { xs: 3, sm: 4, md: 5 }, width: '100%', position: 'relative' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.15rem' }, fontFamily: "'Inter', sans-serif", lineHeight: 1.8, position: 'relative', zIndex: 1 }}>
                Desenhado para otimizar a gestão da sua Loja, o SIGMa garante eficiência administrativa, facilita a comunicação, aumenta o engajamento e fortalece a integração de toda a fraternidade.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </SectionContainer>

      {/* SECTION 2: MODULES */}
      <SectionContainer id="modules-section">
        <FundoRecursos />
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Tektur', sans-serif",
            fontWeight: 600,
            mb: { xs: 4, md: 8 },
            fontSize: { xs: '1.8rem', md: '3rem' },
            color: 'text.primary',
            textShadow: theme.palette.mode === 'dark' ? '0 0 10px rgba(56, 189, 248, 0.5)' : '0 0 10px rgba(2, 132, 199, 0.3)',
            textAlign: 'center'
          }}
        >
          Um sistema moderno e modular
        </Typography>

        <Box sx={{ width: '100%', maxWidth: '1400px', px: { xs: 1, sm: 2 } }}>
          <Grid
            container
            spacing={{ xs: 3, md: 4 }}
            sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'stretch' }}
          >
            {/* Secretaria */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={glassStyle}>
                <Box sx={{ color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7', mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <Box component="img" src={SecretariaIcon} alt="Secretaria" sx={{ width: 50, height: 50, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))' : 'brightness(0.6) drop-shadow(0 0 4px rgba(2, 132, 199, 0.4))' }} />
                </Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Secretaria
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                  Gestão completa de membros e familiares, planejamento e controle de sessões, além da gestão de documentos e cargos da Loja.
                </Typography>
              </Paper>
            </Grid>

            {/* Chancelaria */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={glassStyle}>
                <Box sx={{ color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7', mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <Box component="img" src={ChancelariaIcon} alt="Chancelaria" sx={{ width: 50, height: 50, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))' : 'brightness(0.6) drop-shadow(0 0 4px rgba(2, 132, 199, 0.4))' }} />
                </Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Chancelaria
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                  Gestão de presenças nas sessões, controle de visitantes e visitações, além da gestão de comissões e agenda social completa.
                </Typography>
              </Paper>
            </Grid>

            {/* Tesouraria */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={glassStyle}>
                <Box sx={{ color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7', mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <Box component="img" src={TesourariaIcon} alt="Tesouraria" sx={{ width: 50, height: 50, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))' : 'brightness(0.6) drop-shadow(0 0 4px rgba(2, 132, 199, 0.4))' }} />
                </Box>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Tesouraria
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                  Gestão contábil precisa das atividades da loja, controle de fluxo de caixa e emissão de balancetes.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Módulos Opcionais Carrossel */}
          <Box sx={{ mt: 6, position: 'relative' }}>
            <Typography variant="h5" sx={{ color: 'text.primary', mb: 3, fontFamily: "'Tektur', sans-serif", fontWeight: 400, textAlign: 'left', borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', pb: 1, display: 'inline-block' }}>
              Módulos Opcionais
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <IconButton 
                onClick={() => scrollCarousel('left')} 
                sx={{ 
                  position: 'absolute',
                  left: { xs: 8, md: -24 },
                  zIndex: 10,
                  color: 'text.primary', 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                  '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' } 
                }}
              >
                <ArrowBackIosNew />
              </IconButton>
              
              <Box 
                ref={carouselRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeaveOrUp}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseMove={handleMouseMove}
                sx={{ 
                  display: 'flex', 
                  gap: { xs: 3, md: 4 }, // Mesmos espaçamentos do grid superior
                  width: '100%',
                  overflowX: 'auto', 
                  scrollBehavior: 'smooth',
                  scrollSnapType: 'x mandatory',
                  py: 2,
                  px: 0,
                  // Hide scrollbar
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none'
                }}
              >
                {Array(15).fill([
                  { title: 'Arquitetura', desc: 'Gestão de patrimônio.', icon: <Box component="img" src={ArquitetoIcon} sx={{ width: 48, height: 48, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.5))' : 'brightness(0.6) drop-shadow(0 0 3px rgba(2, 132, 199, 0.4))', pointerEvents: 'none' }}/> },
                  { title: 'Bar', desc: 'Gestão dos ágapes.', icon: <Box component="img" src={BarIcon} sx={{ width: 48, height: 48, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.5))' : 'brightness(0.6) drop-shadow(0 0 3px rgba(2, 132, 199, 0.4))', pointerEvents: 'none' }}/> },
                  { title: 'Orador Virtual', desc: 'Gestão de leis e regulamentos da Ordem.', icon: <Box component="img" src={OradorIcon} sx={{ width: 48, height: 48, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.5))' : 'brightness(0.6) drop-shadow(0 0 3px rgba(2, 132, 199, 0.4))', pointerEvents: 'none' }}/> },
                  { title: 'Biblioteca', desc: 'Acervo de livros e artigos.', icon: <Box component="img" src={BibliotecaIcon} sx={{ width: 48, height: 48, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.5))' : 'brightness(0.6) drop-shadow(0 0 3px rgba(2, 132, 199, 0.4))', pointerEvents: 'none' }}/> },
                  { title: 'Harmonia', desc: 'Músicas para as sessões.', icon: <Box component="img" src={HarmoniaIcon} sx={{ width: 48, height: 48, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.5))' : 'brightness(0.6) drop-shadow(0 0 3px rgba(2, 132, 199, 0.4))', pointerEvents: 'none' }}/> },
                  { title: 'Classificados', desc: 'Anúncios multi-lojas.', icon: <Box component="img" src={ClassificadosIcon} sx={{ width: 48, height: 48, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.5))' : 'brightness(0.6) drop-shadow(0 0 3px rgba(2, 132, 199, 0.4))', pointerEvents: 'none' }}/> },
                  { title: 'Comunicação', desc: 'Avisos e WhatsApp.', icon: <Box component="img" src={ComunicacaoIcon} sx={{ width: 48, height: 48, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.5))' : 'brightness(0.6) drop-shadow(0 0 3px rgba(2, 132, 199, 0.4))', pointerEvents: 'none' }}/> }
                ]).flat().map((modulo, idx) => (
                  <Paper 
                    key={idx} 
                    sx={{ 
                      ...glassStyle, 
                      flex: { xs: '0 0 100%', md: '0 0 calc((100% - 64px) / 3)' }, // 3 por vez no desktop (64px = 2 * gap de 32px)
                      scrollSnapAlign: 'start',
                      border: theme.palette.mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(2, 132, 199, 0.2)',
                      background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg, rgba(19, 27, 41, 0.5) 0%, rgba(3, 105, 161, 0.2) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(2, 132, 199, 0.1) 100%)'
                    }}
                  >
                    <Box sx={{ color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7', mb: 2 }}>
                      {modulo.icon}
                    </Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, mb: 1, fontFamily: "'Inter', sans-serif" }}>
                      {modulo.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif" }}>
                      {modulo.desc}
                    </Typography>
                  </Paper>
                ))}
              </Box>
              
              <IconButton 
                onClick={() => scrollCarousel('right')} 
                sx={{ 
                  position: 'absolute',
                  right: { xs: 8, md: -24 },
                  zIndex: 10,
                  color: 'text.primary', 
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                  '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' } 
                }}
              >
                <ArrowForwardIos />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </SectionContainer>

      {/* SECTION 3: FUNCIONALIDADES EXTRAS */}
      <SectionContainer id="features-section">
        <FundoRecursos />
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Tektur', sans-serif",
            fontWeight: 600,
            mb: { xs: 4, md: 8 },
            fontSize: { xs: '1.8rem', md: '3rem' },
            color: 'text.primary',
            textShadow: theme.palette.mode === 'dark' ? '0 0 10px rgba(56, 189, 248, 0.5)' : '0 0 10px rgba(2, 132, 199, 0.3)',
            textAlign: 'center'
          }}
        >
          Diversas funcionalidades para a sua Loja
        </Typography>

        <Box sx={{ width: '100%', maxWidth: '1400px', px: { xs: 1, sm: 2 } }}>
          <Grid 
            container 
            spacing={{ xs: 3, md: 4 }} 
            alignItems="stretch" 
            sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
          >
            <Grid size={{ xs: 12, md: 6 }} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={{ ...glassStyle, p: 5 }}>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Gestão de Arquivos
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}>
                  Centralize documentos e relatórios, que podem ser acessados rapidamente sempre que necessário por membros autorizados.
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={{ ...glassStyle, p: 5 }}>
                <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mb: 2, fontFamily: "'Inter', sans-serif" }}>
                  Controle de Acesso
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}>
                  Garanta a confidencialidade e assegure-se de que as informações críticas serão acessadas apenas por quem possui o cargo adequado.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </SectionContainer>

      {/* SECTION 4: PLANOS */}
      <SectionContainer id="planos-section">
        <FundoRecursos />
        <Typography
          variant="h3"
          sx={{
            fontFamily: "'Tektur', sans-serif",
            fontWeight: 600,
            mb: { xs: 4, md: 6 },
            fontSize: { xs: '1.8rem', md: '3rem' },
            color: 'text.primary',
            textShadow: theme.palette.mode === 'dark' ? '0 0 10px rgba(56, 189, 248, 0.5)' : '0 0 10px rgba(2, 132, 199, 0.3)',
            textAlign: 'center'
          }}
        >
          Planos e Assinaturas
        </Typography>

        <Box sx={{ width: '100%', maxWidth: '1400px', px: { xs: 1, sm: 2 } }}>
          <Grid 
            container 
            spacing={{ xs: 3, md: 4 }} 
            alignItems="stretch" 
            sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
          >
            
            {/* PLANO BÁSICO */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={{ ...glassStyle, p: 4, textAlign: 'center', border: theme.palette.mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)' }}>
                <Typography variant="h5" sx={{ color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7', fontWeight: 400, mb: 3, fontFamily: "'Tektur', sans-serif" }}>
                  BÁSICO
                </Typography>
                <Box sx={{ textAlign: 'left', mb: 4, minHeight: '180px' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Gestão de Membros Básica</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Calendário de Eventos</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Acesso a Documentos</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Suporte por E-mail</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 3 }}>
                  R$ 75<Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>/mês</Typography>
                </Typography>
                <Button variant="outlined" color="primary" fullWidth sx={{ borderRadius: '20px', py: 1 }} onClick={() => handleOpenContact('Básico')}>
                  Começar Agora
                </Button>
              </Paper>
            </Grid>

            {/* PLANO INTERMEDIÁRIO (DESTAQUE) */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ flex: { md: 1 }, minWidth: { md: 0 }, position: 'relative', zIndex: 1 }}>
              <Paper sx={{ 
                ...glassStyle, 
                p: 4, 
                textAlign: 'center', 
                border: theme.palette.mode === 'dark' ? '2px solid rgba(0, 229, 255, 0.5)' : '2px solid rgba(217, 119, 6, 0.5)',
                boxShadow: theme.palette.mode === 'dark' ? '0 0 20px rgba(0, 229, 255, 0.15)' : '0 6px 20px rgba(217, 119, 6, 0.2)',
                transform: { md: 'scale(1.05)' } 
              }}>
                <Typography variant="h5" sx={{ color: theme.palette.mode === 'dark' ? '#00E5FF' : '#d97706', fontWeight: 600, mb: 3, fontFamily: "'Tektur', sans-serif" }}>
                  INTERMEDIÁRIO
                </Typography>
                <Box sx={{ textAlign: 'left', mb: 4, minHeight: '180px' }}>
                  <Typography variant="body2" sx={{ color: 'text.primary', mb: 1.5, fontWeight: 500 }}>• Todos os recursos do Básico</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Controle Financeiro</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Biblioteca de Rituais</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Fórum de Discussão</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Suporte Prioritário</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: theme.palette.mode === 'dark' ? '#00E5FF' : '#d97706', fontWeight: 'bold', mb: 3 }}>
                  R$ 90<Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>/mês</Typography>
                </Typography>
                <Button variant="contained" sx={{ bgcolor: theme.palette.mode === 'dark' ? '#00E5FF' : '#d97706', color: theme.palette.mode === 'dark' ? '#000' : '#fff', fontWeight: 'bold', borderRadius: '20px', py: 1, '&:hover': { bgcolor: theme.palette.mode === 'dark' ? '#00b8cc' : '#b45309' } }} fullWidth onClick={() => handleOpenContact('Intermediário')}>
                  ASSINAR AGORA
                </Button>
              </Paper>
            </Grid>

            {/* PLANO AVANÇADO */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ flex: { md: 1 }, minWidth: { md: 0 } }}>
              <Paper sx={{ ...glassStyle, p: 4, textAlign: 'center', border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)' }}>
                <Typography variant="h5" sx={{ color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#475569', fontWeight: 400, mb: 3, fontFamily: "'Tektur', sans-serif" }}>
                  AVANÇADO
                </Typography>
                <Box sx={{ textAlign: 'left', mb: 4, minHeight: '180px' }}>
                  <Typography variant="body2" sx={{ color: 'text.primary', mb: 1.5 }}>• Todos os recursos do Intermediário</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Análise de Dados Avançada</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Relatórios Personalizados</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Módulos de Treinamento</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Integrações de API</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>• Gestão de Graus Superiores</Typography>
                </Box>
                <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 'bold', mb: 3 }}>
                  R$ 120<Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>/mês</Typography>
                </Typography>
                <Button variant="outlined" sx={{ color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#475569', borderColor: theme.palette.mode === 'dark' ? '#E0E0E0' : '#94a3b8', borderRadius: '20px', py: 1, '&:hover': { borderColor: theme.palette.mode === 'dark' ? '#fff' : '#334155', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }} fullWidth onClick={() => handleOpenContact('Avançado')}>
                  Assinar
                </Button>
              </Paper>
            </Grid>
          </Grid>
          
          {/* BOTTOM CTA BANNER */}
          <Paper sx={{ 
            ...glassStyle, 
            mt: 6, 
            p: { xs: 3, md: 4 }, 
            textAlign: 'center',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.1) 0%, rgba(19, 27, 41, 0.8) 50%, rgba(56, 189, 248, 0.1) 100%)'
              : 'linear-gradient(90deg, rgba(2, 132, 199, 0.05) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(2, 132, 199, 0.05) 100%)',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)'
          }}>
            <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 600, mb: 3, fontFamily: "'Tektur', sans-serif" }}>
              Prepare sua Loja para o Futuro. Comece agora.
            </Typography>
            <Button variant="contained" color="primary" size="large" onClick={() => navigate('/login', { viewTransition: true })} sx={{ borderRadius: '30px', px: 5, py: 1.5, fontSize: '1.1rem', fontWeight: 'bold', boxShadow: theme.palette.mode === 'dark' ? '0 0 15px rgba(56, 189, 248, 0.4)' : '0 4px 10px rgba(2, 132, 199, 0.3)' }}>
              INICIAR TESTE GRATUITO
            </Button>
          </Paper>
        </Box>
      </SectionContainer>

      {/* SECTION 5: FOOTER */}
      <Box sx={{ width: '100%', scrollSnapAlign: 'end', position: 'relative', zIndex: 1 }}>
        <Rodape />
      </Box>
      {/* FLOATING SEAL (Visible only on inner sections) */}
      <Box
        component="img"
        src={seloIcon}
        alt="Selo Sigma"
        sx={{
          position: 'fixed',
          bottom: { xs: '20px', md: '40px' },
          right: { xs: '20px', md: '40px' },
          width: '110px',
          height: 'auto',
          transform: `scale(${showSelo ? 1 : 0.5})`,
          opacity: showSelo ? 1 : 0,
          pointerEvents: showSelo ? 'auto' : 'none',
          filter: 'drop-shadow(0 0 15px rgba(0, 176, 255, 0.4)) drop-shadow(0 5px 15px rgba(0,0,0,0.5))',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 999,
        }}
      />
      {/* CONTACT DIALOG */}
      <Dialog open={openContact} onClose={() => setOpenContact(false)} PaperProps={{ sx: { background: theme.palette.mode === 'dark' ? 'rgba(19, 27, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: theme.palette.mode === 'dark' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)', color: 'text.primary', minWidth: { xs: '90vw', md: '500px' } } }}>
        <DialogTitle sx={{ fontFamily: "'Tektur', sans-serif", color: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7' }}>
          Solicitar Plano {selectedPlan}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? '#E0E0E0' : '#475569', mb: 3, mt: 1 }}>
            Preencha os dados abaixo e entraremos em contato para finalizar a assinatura.
          </Typography>
          <TextField fullWidth label="Nome do Responsável" variant="outlined" sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: 'text.primary', '& fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }, '&:hover fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }, '&.Mui-focused fieldset': { borderColor: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7' } }, '& .MuiInputLabel-root': { color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' } }} value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} />
          <TextField fullWidth label="Email de Contato" variant="outlined" sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: 'text.primary', '& fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }, '&:hover fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }, '&.Mui-focused fieldset': { borderColor: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7' } }, '& .MuiInputLabel-root': { color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' } }} value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} />
          <TextField fullWidth label="Telefone / WhatsApp" variant="outlined" sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: 'text.primary', '& fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }, '&:hover fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }, '&.Mui-focused fieldset': { borderColor: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7' } }, '& .MuiInputLabel-root': { color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' } }} value={contactForm.phone} onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} />
          <TextField fullWidth label="Mensagem Opcional" variant="outlined" multiline rows={3} sx={{ '& .MuiOutlinedInput-root': { color: 'text.primary', '& fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }, '&:hover fieldset': { borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }, '&.Mui-focused fieldset': { borderColor: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7' } }, '& .MuiInputLabel-root': { color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' } }} value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setOpenContact(false)} sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleContactSubmit} sx={{ bgcolor: theme.palette.mode === 'dark' ? '#38bdf8' : '#0284c7', '&:hover': { bgcolor: '#0081CB' } }}>Enviar Solicitação</Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  );
};


