import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ============================================================
// IMPORTANT: Change the base path to match your GitHub repository name.
// Example: if your repo is https://github.com/johndoe/ev-charging-assistant,
//          set base to '/ev-charging-assistant/'
// For a custom domain or user/org page (username.github.io), set base to '/'
// ============================================================
const GITHUB_REPO_NAME = 'EV-Assistant' 

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? `/${GITHUB_REPO_NAME}/` : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
}))
