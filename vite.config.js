import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite only exposes import.meta.env vars matching one of these prefixes;
  // REACT_VITE_ is added so REACT_VITE_API_URL (in .env) is usable client-side.
  envPrefix: ['VITE_', 'REACT_VITE_'],
})
