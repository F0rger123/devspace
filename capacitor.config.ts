export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    cleartext?: boolean;
    url?: string;
  };
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: 'com.devspace.aether',
  appName: 'DevSpace',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#030305',
      showSpinner: true,
      spinnerColor: '#EAB308'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#030305'
    }
  }
};

export default config;
