import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.esigma.hub',
  appName: 'e-Sigma',
  webDir: 'dist',
  server: {
    url: 'https://e-sigma.app',
    cleartext: true
  }
};

export default config;
