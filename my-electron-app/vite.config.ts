import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allow Node.js modules like `crypto` to be used in the renderer process
      crypto: 'crypto-browserify',
    },
  },
  
});
