import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tiggey.wkly',
  appName: 'WKLY',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      keystorePassword: undefined,
    },
    backgroundColor: '#212121',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#212121',
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '693554017260-kdskvf1cff14g1kucitivje5j6vinikr.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;

