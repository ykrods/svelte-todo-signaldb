import path from "node:path";
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
    outDir: "backend/dist",
  },
  resolve: {
    alias: [
      { find: "$lib/", replacement: path.join(__dirname, "src/lib/") },
    ],
  },
  plugins: [
    tailwindcss(),
    svelte(),
  ],
})
