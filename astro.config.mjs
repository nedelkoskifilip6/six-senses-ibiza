import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  site: 'https://nedelkoskifilip6.github.io',
  base: '/six-senses-ibiza',
  output: 'static',
  trailingSlash: 'always',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false }
});
