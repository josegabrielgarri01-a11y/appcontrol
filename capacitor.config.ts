import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.parentalcontrol.app',
  appName: 'Control Parental',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Geolocation: {
      permissions: ['location'],
    },
  },
};

export default config;
