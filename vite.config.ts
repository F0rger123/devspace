import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Automatically bootstrap firebase-applet-config.json if missing to prevent build failures during deployment
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  try {
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        apiKey: "placeholder-api-key-safe-fallback-value",
        authDomain: "placeholder-domain.firebaseapp.com",
        projectId: "placeholder-id",
        storageBucket: "placeholder-id.appspot.com",
        messagingSenderId: "000000000000",
        appId: "1:000000000000:web:0000000000000000000000"
      }, null, 2)
    );
    console.log("Automatically generated fallback firebase-applet-config.json successfully.");
  } catch (err) {
    console.error("Could not write automatic fallback firebase-applet-config.json:", err);
  }
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
