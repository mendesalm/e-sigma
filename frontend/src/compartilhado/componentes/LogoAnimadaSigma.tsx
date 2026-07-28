import React, { useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import './LogoAnimadaSigma.css';

export type SigmaTheme = 'prata' | 'ouro' | 'carbono' | 'cyber' | 'cyber-light';

interface LogoAnimadaSigmaProps {
  theme?: SigmaTheme;
  width?: number | string;
  height?: number | string;
  showText?: boolean;
  animated?: boolean;
}

const neonColors = ['#4A90E2', '#D4AF37', '#00FF9D', '#FF0055', '#B026FF', '#FFFFFF', '#38bdf8'];

export const LogoAnimadaSigma: React.FC<LogoAnimadaSigmaProps> = ({ 
  theme = 'prata', 
  width = 260, 
  height = 260,
  showText = true,
  animated = true
}) => {
  const muiTheme = useTheme();
  const track0Ref = useRef<SVGPathElement>(null);
  const track1Ref = useRef<SVGPathElement>(null);
  const track2Ref = useRef<SVGPathElement>(null);
  const glow1Ref = useRef<SVGEllipseElement>(null);
  const glow2Ref = useRef<SVGEllipseElement>(null);

  // Auto-map cyber to cyber-light if MUI theme is in light mode
  const resolvedTheme = (theme === 'cyber' && muiTheme.palette.mode === 'light') ? 'cyber-light' : theme;

  useEffect(() => {
    if (!animated) return;
    
    let isMounted = true;
    const tracks = [track0Ref.current, track1Ref.current, track2Ref.current].filter(Boolean) as SVGPathElement[];
    if (tracks.length === 0) return;

    function launchGlow(glowElement: SVGEllipseElement | null) {
      if (!isMounted || !glowElement) return;

      const trackIdx = Math.floor(Math.random() * tracks.length);
      const track = tracks[trackIdx];
      const totalLen = track.getTotalLength();
      
      const reverse = Math.random() > 0.5;
      const color = neonColors[Math.floor(Math.random() * neonColors.length)];
      glowElement.setAttribute('fill', color);
      
      const duration = 1500 + Math.random() * 1000; 
      
      const animation = glowElement.animate([
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.1 },
        { opacity: 1, offset: 0.9 },
        { opacity: 0, offset: 1 }
      ], {
        duration: duration,
        easing: 'ease-in-out',
        fill: 'forwards'
      });

      let start: number | null = null;
      let frameId: number;

      function step(timestamp: number) {
        if (!isMounted) return;
        if (!start) start = timestamp;
        const progress = (timestamp - start) / duration;
        
        if (progress < 1) {
          const p = reverse ? (1 - progress) : progress;
          const point = track.getPointAtLength(p * totalLen);
          
          const delta = 10;
          const nextP = Math.min(Math.max(p * totalLen + (reverse ? -delta : delta), 0), totalLen);
          const pointNext = track.getPointAtLength(nextP);
          
          let dx = pointNext.x - point.x;
          let dy = pointNext.y - point.y;
          
          if (dx === 0 && dy === 0) {
            const prevP = Math.min(Math.max(p * totalLen + (reverse ? delta : -delta), 0), totalLen);
            const pointPrev = track.getPointAtLength(prevP);
            dx = point.x - pointPrev.x;
            dy = point.y - pointPrev.y;
          }
          
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          glowElement.setAttribute('transform', `translate(${point.x}, ${point.y}) rotate(${angle})`);
          frameId = requestAnimationFrame(step);
        } else {
          setTimeout(() => launchGlow(glowElement), Math.random() * 2000 + 500);
        }
      }
      frameId = requestAnimationFrame(step);
    }

    const t1 = setTimeout(() => launchGlow(glow1Ref.current), 800);
    const t2 = setTimeout(() => launchGlow(glow2Ref.current), 1800);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [animated]);

  return (
    <div className="sigma-logo-wrapper" data-theme={resolvedTheme === 'prata' ? undefined : resolvedTheme}>
      <div className="sigma-logo-container">
        <div className={`sigma-logo-symbol ${animated ? 'sigma-logo-animated' : ''}`} style={{ width, height, marginBottom: showText ? '20px' : '0' }}>
          <svg viewBox="500 5500 21000 18000" width="100%" height="100%">
              <defs>
                  <linearGradient id="metalGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop className="light" offset="0%" />
                      <stop className="mid" offset="40%" />
                      <stop className="dark" offset="80%" />
                      <stop className="deep" offset="100%" />
                  </linearGradient>

                  <filter id="bevel">
                      <feDropShadow dx="0" dy="250" stdDeviation="150" floodColor="#000000" floodOpacity="0.9" />
                      <feOffset dx="0" dy="100" />
                      <feGaussianBlur stdDeviation="80" result="offset-blur" />
                      <feComposite operator="out" in="SourceGraphic" result="inverse" />
                      <feFlood floodColor="white" floodOpacity="0.3" result="color" />
                      <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                      <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                  </filter>

                  <filter id="dataGlow" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="80" result="blur" />
                      <feMerge>
                          <feMergeNode in="blur"/>
                          <feMergeNode in="blur"/>
                          <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                  </filter>

                  <path id="track0" ref={track0Ref} d="M 11051.65 7326.68 A 13200 13200 0 0 1 2269.37 22538.04" fill="none" />
                  <path id="track1" ref={track1Ref} d="M 2269.37 22538.04 A 13200 13200 0 0 1 19833.93 22538.04" fill="none" />
                  <path id="track2" ref={track2Ref} d="M 19833.93 22538.04 A 13200 13200 0 0 1 11051.65 7326.68" fill="none" />
              </defs>

              <g filter="url(#bevel)" fill="url(#metalGrad1)" fillRule="nonzero">
                  <path d="M10246.61 15107.01l1646.58 2148.36 -1814.02 2299.78 2065.42 -25.55c295.72,-3.65 974.37,-121.05 1133.28,-864.43l386.04 15.58 -286.41 1692.14 -4765.82 0 2173.87 -2929.56 -2121 -2904.39 4731.89 6.19 216.34 1547.31 -410.31 10.31c-448.92,-1322.85 -1415.56,-973 -2955.86,-995.74z"/>
                  <path d="M6981.44 13559.31c-63.13,216.36 -115.61,434.94 -156.05,652.52 -23.77,127.86 -43.57,256.13 -59.14,384.17 593.61,-389.86 1234.4,-701.26 1910.54,-921.09 753.79,-245.09 1550.9,-376.63 2374.86,-376.63 1133.26,0 2215.31,248.82 3203.5,699.64 1024.78,467.53 1947.07,1152.03 2719.34,2001.21 680.69,748.48 1245.45,1624.61 1662.22,2593.08 376.73,875.44 632.74,1827.71 744.36,2830.73 35.6,-14.13 72,-26.63 109.12,-37.43 110.31,-32.07 225.72,-49.28 343.74,-49.28 99.62,0 197.75,12.35 292.84,35.63 11.54,2.82 23.01,5.81 34.42,8.96 -117.01,-1089.71 -393.19,-2126.16 -802.37,-3080.46 -452.14,-1054.51 -1066.89,-2009.2 -1808.79,-2824.99 -846.96,-931.32 -1858.9,-1681.43 -2983.61,-2192.96 -1082.01,-492.11 -2269.09,-763.69 -3514.77,-763.69 -732.19,0 -1442.95,93.39 -2122.94,269.84 -681.05,176.73 -1333.3,437.12 -1947.27,770.75z"/>
                  <path d="M5336.08 15072.19c8.78,-132.04 20.87,-264.14 36.15,-396.37 -95.29,82.41 -188.95,166.76 -280.9,252.96 -185.39,173.81 -364.91,356.19 -538.07,546.59 -741.9,815.79 -1356.64,1770.47 -1808.79,2824.99 -409.17,954.29 -685.35,1990.75 -802.36,3080.46 11.41,-3.15 22.88,-6.14 34.41,-8.96 95.09,-23.28 193.22,-35.63 292.85,-35.63 118.02,0 233.42,17.21 343.72,49.28 37.13,10.8 73.55,23.31 109.16,37.44 115.77,-1038.39 390.98,-2052.81 817.79,-2996.6 437.27,-966.89 1033.86,-1860.88 1781.31,-2632.06 -6.27,-243 -1.13,-483.54 14.73,-722.1z"/>
                  <path d="M16325.15 18515.36c99.95,159.12 190.96,301.63 267.86,420.12 524.94,808.82 1511.98,2299.3 2471.37,3113.88 161.74,-254.21 445.94,-422.86 769.55,-422.86 503.43,0 911.53,408.11 911.53,911.54 0,503.43 -408.1,911.53 -911.53,911.53 -503.43,0 -911.54,-408.1 -911.54,-911.53 0,-153.96 38.23,-298.97 105.62,-426.15 -1269.12,-457.89 -3249.38,-556.45 -4292.44,-598.1 -49.02,-1.96 -101.64,-3.94 -157.22,-5.9 73.55,-83.32 145.68,-168.21 216.31,-254.69 106.1,10.85 212.27,22.21 318.51,34.2 953.23,107.64 2721.27,303.16 3893.36,773.98 11.37,9.33 22.7,18.55 33.99,27.65 2.59,-4.57 5.23,-9.11 7.9,-13.64 -15.3,-5.9 -30.74,-11.78 -46.32,-17.62 -875.02,-720.12 -1958.05,-2095.21 -2788.69,-3231 39.3,-103.33 76.55,-207.14 111.74,-311.41z"/>
                  <path d="M16470.74 15896.49c-155.81,-162.85 -318.87,-317.59 -487.08,-461.4 -98.84,-84.51 -200.03,-165.8 -303.13,-243.3 40.83,709.01 -9.89,1419.65 -157.58,2115.12 -164.64,775.35 -449.28,1531.43 -861.26,2245.01 -566.63,981.43 -1323.14,1794.1 -2207.65,2424.49 -917.29,653.72 -1971.23,1110.19 -3092.77,1354.41 -988.55,215.25 -2029.68,266.29 -3076.79,142.98 -946.51,-111.46 -1899.21,-365.88 -2823.66,-770.73 -5.56,37.9 -12.94,75.67 -22.15,113.22 -27.38,111.57 -70.18,220.12 -129.19,322.33 -49.81,86.27 -109.57,165.08 -177.27,235.79 -8.22,8.58 -16.54,17.02 -24.97,25.33 1002.22,443.52 2037.9,722.57 3068.94,845.36 1139.3,135.69 2273.46,80.64 3350.91,-153.97 1230.02,-267.83 2385.61,-769.14 3390.96,-1487.4 967.19,-690.99 1795.92,-1583.24 2418.76,-2662.03 366.1,-634.1 640.6,-1296.33 827.78,-1973.44 187.47,-678.18 288.1,-1373.24 306.15,-2071.77z"/>
                  <path d="M15983.23 13715.13c109.96,73.62 218.31,150.15 325.19,229.49 -23.73,-123.73 -49.95,-247.01 -78.62,-369.74 -57.83,-247.46 -126.02,-494.12 -204.33,-739.28 -335.54,-1050.4 -854.95,-2060.12 -1542.12,-2978.95 -621.85,-831.5 -1381.36,-1588.91 -2266.57,-2235.1 -2.98,11.46 -6.13,22.89 -9.45,34.28 -27.38,93.99 -65.75,185.15 -115.57,271.43 -59.01,102.21 -131.61,193.55 -214.54,273.03 -27.91,26.76 -56.96,52.04 -87,75.82 841.39,619.45 1582.3,1365 2186.24,2206.52 618.71,862.14 1094.64,1825.79 1388.77,2858.69 213.58,116.07 419.33,240.8 618,373.81z"/>
                  <path d="M9693.85 22959.09c218.94,-53.51 434.48,-117.35 643.13,-191.12 122.61,-43.35 243.6,-90.33 362.27,-140.87 -634.44,-319.15 -1224.51,-718.39 -1752.96,-1194.03 -589.15,-530.26 -1101.62,-1154.8 -1513.6,-1868.38 -566.63,-981.43 -892.17,-2042.92 -995.85,-3124.13 -107.49,-1121.25 24.16,-2262.22 373.43,-3355.62 307.86,-963.73 784.23,-1890.9 1414.57,-2736.06 569.78,-763.98 1266.47,-1461.83 2079.3,-2060 -30.04,-23.77 -59.06,-49.04 -86.97,-75.79 -82.93,-79.5 -155.54,-170.84 -214.55,-273.05 -49.81,-86.27 -88.18,-177.43 -115.57,-271.42 -3.32,-11.4 -6.47,-22.83 -9.45,-34.29 -885.21,646.19 -1644.71,1403.59 -2266.57,2235.1 -687.16,918.82 -1206.57,1928.56 -1542.12,2978.96 -383.06,1199.15 -526.71,2450.57 -407.35,3680.36 114.82,1183.1 473.17,2346.93 1096.01,3425.72 366.09,634.1 802.35,1202.94 1295.16,1703.6 493.58,501.45 1045.2,936.12 1641.12,1301.02z"/>
                  <path d="M11826.72 23627.57c-118.74,58.42 -239.18,113.99 -361.34,166.88 119.02,41.32 238.9,80.25 359.52,116.78 243.22,73.65 490.93,137.93 742.4,192.69 1077.44,234.61 2211.59,289.65 3350.91,153.96 1031.02,-122.79 2066.71,-401.84 3068.93,-845.36 -8.43,-8.31 -16.75,-16.75 -24.96,-25.32 -67.71,-70.71 -127.47,-149.52 -177.28,-235.8 -59.01,-102.21 -101.81,-210.76 -129.18,-322.31 -9.22,-37.56 -16.59,-75.35 -22.16,-113.26 -957.16,418.94 -1973.28,687.81 -3004.03,790.08 -1055.98,104.75 -2128.5,35.09 -3170.08,-226.63 -207.31,126.93 -418.2,242.74 -632.73,348.29z"/>
                  <path d="M3054.88 22075.39c15.3,-5.9 30.74,-11.78 46.32,-17.62 -12.85,10.57 -25.65,21.01 -38.4,31.3 -2.6,-4.59 -5.24,-9.15 -7.92,-13.68z"/>
                  <path d="M5778.15 18515.36c-99.95,159.12 -190.96,301.63 -267.86,420.12 -524.94,808.82 -1512,2299.29 -2471.38,3113.88 -161.75,-254.2 -445.93,-422.86 -769.54,-422.86 -503.43,0 -911.53,408.11 -911.53,911.54 0,503.43 408.1,911.53 911.53,911.53 503.43,0 911.54,-408.1 911.54,-911.53 0,-152.35 -37.43,-295.93 -103.51,-422.15 1185.15,-423.54 2969.42,-533.11 3932.33,-583.31 141.06,-7.35 309.99,-14.91 497.76,-21.91 -72.7,-82.61 -143.98,-166.78 -213.81,-252.48 -1398.95,151.46 -3131.33,401.85 -4192.48,799.58 875.02,-720.12 1958.05,-2095.21 2788.69,-3231 -39.3,-103.33 -76.55,-207.14 -111.74,-311.41z"/>
                  <path d="M11051.65 6415.15c-503.43,0 -911.53,408.1 -911.53,911.53 0,492.08 389.93,893.02 877.65,910.85 -237.97,1328.06 -1142.81,3092.39 -1628.29,4016.57 -22.81,43.43 -47.4,89.99 -73.5,139.11 108.93,-22.04 218.52,-42.06 328.73,-59.99 43.65,-97.31 86.9,-194.93 129.63,-292.93 383.4,-879.35 1098.09,-2508.27 1276.4,-3758.74 -2.41,-14.57 -4.74,-29.04 -6.98,-43.43 2.64,0.02 5.25,0.1 7.89,0.1 2.64,0 5.25,-0.08 7.89,-0.1 -2.24,14.39 -4.57,28.86 -6.98,43.43 178.31,1250.47 893,2879.39 1276.4,3758.74 42.73,98 85.98,195.62 129.63,292.93 110.21,17.93 219.8,37.95 328.73,59.99 -26.1,-49.12 -50.69,-95.68 -73.5,-139.11 -485.48,-924.18 -1390.32,-2688.51 -1628.29,-4016.57 487.72,-17.83 877.66,-418.77 877.66,-910.85 0,-503.43 -408.11,-911.53 -911.54,-911.53z"/>
              </g>

              {animated && (
                <g id="animation-layer">
                  <ellipse ref={glow1Ref} cx="0" cy="0" rx="450" ry="60" fill="var(--m-accent)" filter="url(#dataGlow)" style={{ opacity: 0, mixBlendMode: 'screen' }} />
                  <ellipse ref={glow2Ref} cx="0" cy="0" rx="450" ry="60" fill="var(--m-accent)" filter="url(#dataGlow)" style={{ opacity: 0, mixBlendMode: 'screen' }} />
                </g>
              )}
          </svg>
        </div>
        
        {showText && (
          <>
            <div className="sigma-logo-text" style={{ fontSize: typeof width === 'number' ? width * 0.17 : '46px' }}>SIGMA</div>
            <div className="sigma-subtitle" style={{ fontSize: typeof width === 'number' ? width * 0.05 : '14px' }}>Gestão & Fraternidade</div>
          </>
        )}
      </div>
    </div>
  );
};

export default LogoAnimadaSigma;
