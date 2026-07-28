import React from 'react';
import { SvgIcon, SvgIconProps, useTheme } from '@mui/material';

interface MemberPanelIconProps extends SvgIconProps {
  active?: boolean;
}

export const MemberPanelIcon: React.FC<MemberPanelIconProps> = ({ active, sx, ...props }) => {
  const theme = useTheme();
  
  // Se estiver ativo, fica dourado, senão usa a cor do texto do tema
  const color = active ? (theme.palette.mode === 'dark' ? '#D4AF37' : '#B8860B') : 'inherit';

  return (
    <SvgIcon 
      viewBox="5000 10000 34000 30000" 
      sx={{ color, ...sx }} 
      {...props}
    >
      <g>

   <polygon fill="transparent" stroke="currentColor" strokeWidth="800" points="36722.2,11951 18243.9,11951 18243.9,27020.4 36722.2,27020.4 "/>
   <polyline fill="none" stroke="currentColor" strokeWidth="800" strokeLinecap="round" strokeLinejoin="round" points="17448.5,25781.3 21412.5,16302.2 24666.9,22409.2 29017.1,15809.1 32481.3,20456.3 36168.3,15615.4 "/>
   <g>
    <path id="person_add_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" fill="currentColor" stroke={theme.palette.background.paper} strokeWidth="400" strokeLinejoin="round" d="M19597.1 15571.3c504.3,-504.4 756.4,-1110.9 756.4,-1819.2 0,-708.8 -252.1,-1314.8 -756.4,-1819.6 -504.4,-504.3 -1110.9,-756.5 -1819.2,-756.5 -708.8,0 -1314.8,252.2 -1819.6,756.5 -504.3,504.8 -756.5,1110.8 -756.5,1819.6 0,708.3 252.2,1314.8 756.5,1819.2 504.3,504.3 1110.8,756.4 1819.6,756.4 708.3,0 1314.4,-252.1 1819.2,-756.4z"/>
    <path id="person_add_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg_22" fill="currentColor" stroke={theme.palette.background.paper} strokeWidth="400" strokeLinejoin="round" d="M7426.1 28475.1c0,-1120.8 188.8,-2150.5 565.8,-3089.8 377.6,-939.3 878.9,-1655.9 1504.4,-2149.9 1337,-1021.5 2695.6,-1787.4 4076.2,-2298.5 1380.1,-510.4 2781.8,-765.9 4205.4,-765.9 1423.2,0 2824.8,255.5 4204.9,765.9 1380.6,511.1 2739.2,1277 4076.3,2298.5 625.5,494 1126.7,1210.6 1504.3,2149.9 377.1,939.3 565.8,1969 565.8,3089.1 0,3467.8 -0.2,6934.7 -0.2,10402.5l-20703.1 0c0,-3467.5 0.2,-6934.2 0.2,-10401.8z"/>
    <path id="person_add_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg_23" fill="currentColor" stroke={theme.palette.background.paper} strokeWidth="400" strokeLinejoin="round" d="M14139.1 17390.4c-1009.1,-1008.6 -1513.4,-2221.7 -1513.4,-3638.3 0,-1417 504.3,-2629.6 1513.4,-3638.8 1009.2,-1008.6 2221.7,-1513.4 3638.8,-1513.4 1416.6,0 2629.2,504.8 3638.3,1513.4 1009.1,1009.2 1513.5,2221.8 1513.5,3638.8 0,1416.6 -504.4,2629.7 -1513.5,3638.3 -1009.1,1009.1 -2221.7,1513.5 -3638.3,1513.5 -1417.1,0 -2629.6,-504.4 -3638.8,-1513.5z"/>
    <polygon fill="currentColor" stroke={theme.palette.background.paper} strokeWidth="400" strokeLinejoin="round" points="17777.6,28526.3 19918.1,25157.2 21498.6,21086.7 17900.6,20631.4 14056.6,21086.7 15514,24911.1 "/>
    <polygon fill="currentColor" stroke={theme.palette.background.paper} strokeWidth="400" strokeLinejoin="round" points="17765.5,21727.1 18298.4,21111.7 18858.2,20465.4 17738.7,20465.4 16619.2,20465.4 17178.9,21111.7 17711.8,21727.1 16988.3,27265.7 17483.5,28587.9 17993.9,28587.9 18672.6,27117.7 "/>
    <g>
     <polygon fill="currentColor" stroke={theme.palette.background.paper} strokeWidth="400" strokeLinejoin="round" points="12209.6,29641.4 23529.3,29641.4 23529.3,38002.7 12209.6,38002.7 "/>
     <path fill="currentColor" stroke={theme.palette.background.paper} strokeWidth="400" strokeLinejoin="round" d="M12029.2 29280.6l11857.6 0 0 9082.9 -12218.5 0 0 -9082.9 360.9 0zm5748.4 3758.6l3875.5 -2850.4 -7751 0 3875.5 2850.4zm2699.6 -1091.8l-2699.6 1985.6 -5344.5 -3930.8 -43.1 0 0 7639.6 10775.1 0 0 -7639.6 -43 0 -2644.9 1945.2z"/>
    </g>
    <g>
     <g>
      <path fill="currentColor" stroke={theme.palette.background.paper} strokeWidth="400" strokeLinejoin="round" d="M15017.3 34713.2c-502.2,0 -909.4,368.3 -909.4,822.7 0,454.4 407.2,822.7 909.4,822.7 502.2,0 909.3,-368.3 909.3,-822.7 0,-454.4 -407.1,-822.7 -909.3,-822.7z"/>
      <path fill="currentColor" stroke={theme.palette.background.paper} strokeWidth="400" strokeLinejoin="round" d="M20537.8 34713.2c-502.2,0 -909.3,368.3 -909.3,822.7 0,454.4 407.1,822.7 909.3,822.7 502.3,0 909.4,-368.3 909.4,-822.7 0,-454.4 -407.1,-822.7 -909.4,-822.7z"/>
     </g>
     <path fill="currentColor" stroke={theme.palette.background.paper} strokeWidth="400" strokeLinejoin="round" d="M17777.6 30635.9c-502.3,0 -909.4,368.3 -909.4,822.7 0,454.4 407.1,822.8 909.4,822.8 502.2,0 909.3,-368.4 909.3,-822.8 0,-454.4 -407.1,-822.7 -909.3,-822.7z"/>
    </g>
   </g>
  
      </g>
    </SvgIcon>
  );
};
