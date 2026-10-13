import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base defaults to '/' which is correct for Render / Netlify / Vercel.
// (The previous '/Mayden-Ecommerce/' base was for GitHub Pages and breaks
// asset paths when hosted at the root of a domain.)
export default defineConfig({
  plugins: [react()],
});