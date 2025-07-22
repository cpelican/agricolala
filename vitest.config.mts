import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
 
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    env: {
      ENABLE_DB_TESTS: 'true',
      DATABASE_URL: 'postgresql://agraria:agraria@localhost:5433/agraria',
      DIRECT_URL: 'postgresql://agraria:agraria@localhost:5433/agraria',
      NODE_ENV: 'test',
    },
    poolOptions: {
      threads: {
        maxThreads: 1,
      },
    },
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10_000, // 10 seconds for database tests
    include: ['**/*.test.ts', '**/*.test.tsx', '!test/**/setup.ts'], // Include all tests including database tests
  },
})