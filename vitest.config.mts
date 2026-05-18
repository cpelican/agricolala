import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
  const env = loadEnv('test', process.cwd(), '')

  return {
    plugins: [tsconfigPaths(), react()],
    mode: 'test',
    test: {
      environment: 'jsdom',
      env,
      fileParallelism: false,
      maxWorkers: 1,
      minWorkers: 1,
      sequence: {
        concurrent: false,
      },
      poolOptions: {
        threads: {
          maxThreads: 1,
          minThreads: 1,
        },
      },
      setupFiles: ['./test/setup.ts'],
      globalSetup: './test/server-setup.ts',
      testTimeout: 10_000,
      include: ['**/*.test.ts', '**/*.test.tsx', '!test/**/setup.ts'],
    },
  }
})