import React, { useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';

const FundoRecursos: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();

  useEffect(() => {
    const can = canvasRef.current;
    if (!can) return;
    const ctx = can.getContext("2d");
    if (!ctx) return;

    const mode = theme.palette.mode;
    let animationFrameId: number;

    const setSize = () => {
      if (!can.parentElement) return;
      can.width = can.parentElement.offsetWidth;
      can.height = can.parentElement.offsetHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Data grid logic
    const gridSpacing = 80;
    
    // Create random pulses that travel along the grid
    let pulses: any[] = [];
    
    function initPulses() {
      if (!can) return;
      pulses = [];
      const numPulses = Math.min(20, Math.floor(can.width / 50));
      for (let i = 0; i < numPulses; i++) {
        createPulse();
      }
    }
    
    function createPulse() {
      if (!can) return;
      const isHorizontal = Math.random() > 0.5;
      const startLine = Math.floor(Math.random() * (isHorizontal ? can.height / gridSpacing : can.width / gridSpacing)) * gridSpacing;
      
      pulses.push({
        x: isHorizontal ? Math.random() * can.width : startLine,
        y: isHorizontal ? startLine : Math.random() * can.height,
        length: Math.random() * 50 + 20,
        speed: (Math.random() * 1.5 + 0.5) * (Math.random() > 0.5 ? 1 : -1),
        isHorizontal,
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    initPulses();

    function draw() {
      if (!can || !ctx) return;
      ctx.clearRect(0, 0, can.width, can.height);
      ctx.fillStyle = mode === 'dark' ? "#0B0F19" : "#f8fafc";
      ctx.fillRect(0, 0, can.width, can.height);

      // Draw faint grid
      ctx.beginPath();
      ctx.strokeStyle = mode === 'dark' ? "rgba(56, 189, 248, 0.03)" : "rgba(2, 132, 199, 0.05)";
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= can.width; x += gridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, can.height);
      }
      for (let y = 0; y <= can.height; y += gridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(can.width, y);
      }
      ctx.stroke();

      // Draw active pulses
      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i];
        
        ctx.beginPath();
        const pulseColor = mode === 'dark' ? '56, 189, 248' : '2, 132, 199';
        ctx.strokeStyle = `rgba(${pulseColor}, ${p.opacity})`;
        ctx.lineWidth = 2;
        
        if (p.isHorizontal) {
          p.x += p.speed;
          if (p.x > can.width + p.length) p.x = -p.length;
          if (p.x < -p.length) p.x = can.width + p.length;
          
          const grad = ctx.createLinearGradient(p.x - p.length, 0, p.x, 0);
          grad.addColorStop(0, `rgba(${pulseColor}, 0)`);
          grad.addColorStop(1, `rgba(${pulseColor}, ${p.opacity})`);
          ctx.strokeStyle = grad;
          
          ctx.moveTo(p.x - (p.speed > 0 ? p.length : -p.length), p.y);
          ctx.lineTo(p.x, p.y);
        } else {
          p.y += p.speed;
          if (p.y > can.height + p.length) p.y = -p.length;
          if (p.y < -p.length) p.y = can.height + p.length;
          
          const grad = ctx.createLinearGradient(0, p.y - p.length, 0, p.y);
          grad.addColorStop(0, `rgba(${pulseColor}, 0)`);
          grad.addColorStop(1, `rgba(${pulseColor}, ${p.opacity})`);
          ctx.strokeStyle = grad;
          
          ctx.moveTo(p.x, p.y - (p.speed > 0 ? p.length : -p.length));
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    }
    
    // Performance: only animate if visible
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!animationFrameId) draw();
      } else {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    }, { threshold: 0 });
    
    observer.observe(can);

    return () => {
      window.removeEventListener('resize', setSize);
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [theme.palette.mode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
};

export default FundoRecursos;
