import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const githubRepository = process.env.GITHUB_REPOSITORY
const githubRepositoryName = githubRepository?.split('/')[1]
const basePath = process.env.GITHUB_ACTIONS && githubRepositoryName
  ? `/${githubRepositoryName}/`
  : '/'

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: false,
  },
})
