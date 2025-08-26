import path from "node:path"
import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    minify: false,
    sourcemap: true,
  },
  resolve: {
    alias: [
      { find: "$lib/", replacement: path.join(__dirname, "src/app/lib/") },
    ],
  },
  plugins: [
    tailwindcss(),
    svelte(),
    cloudflare(),
  ],
})
