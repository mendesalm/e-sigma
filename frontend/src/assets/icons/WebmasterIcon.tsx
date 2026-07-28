import React from 'react';
import { SvgIcon, SvgIconProps, useTheme } from '@mui/material';

interface WebmasterIconProps extends SvgIconProps {
  active?: boolean;
}

export const WebmasterIcon: React.FC<WebmasterIconProps> = ({ active, sx, ...props }) => {
  const theme = useTheme();
  
  // Se estiver ativo, fica dourado, senão usa a cor do texto do tema
  const color = active ? (theme.palette.mode === 'dark' ? '#D4AF37' : '#B8860B') : 'inherit';

  return (
    <SvgIcon 
      viewBox="0 0 24 24" 
      sx={{ color, ...sx }} 
      {...props}
    >
      <g>
        {/* Computer / Terminal shape */}
        <path 
          fill="currentColor" 
          stroke={theme.palette.background.paper} 
          strokeWidth="0.5" 
          strokeLinejoin="round" 
          d="M20,18c1.1,0,1.99,-0.9,1.99,-2L22,6c0,-1.1,-0.9,-2,-2,-2H4C2.9,4,2,4.9,2,6v10c0,1.1,0.9,2,2,2H0v2h24v-2H20z M4,6h16v10H4V6z" 
        />
        {/* Code brackets inside the screen */}
        <path 
          fill="currentColor" 
          stroke={theme.palette.background.paper} 
          strokeWidth="0.2" 
          d="M9.4 14.6L7.8 16l-4-4 4-4 1.6 1.4L6.6 12l2.8 2.6zm5.2-8.6l1.6-1.4 4 4-4 4-1.6-1.4L17.4 12l-2.8-2.6z" 
        />
      </g>
    </SvgIcon>
  );
};
