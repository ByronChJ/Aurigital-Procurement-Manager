import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Proveer el path a la aplicación de Next.js para cargar el next.config.js y los .env correctos en el entorno de pruebas
  dir: './',
})

// Configuración personalizada de Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Todas las pruebas viven bajo /__test__ (convención del proyecto)
  testMatch: ['<rootDir>/__test__/**/*.test.[jt]s', '<rootDir>/__test__/**/*.test.[jt]sx'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  // Las page.tsx/layout de App Router son principalmente composición; la lógica se prueba en actions y componentes.
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!src/**/page.tsx',
    '!src/app/layout.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  // Objetivo principal: ≥95% en statements/líneas. Ramas/funciones quedan más bajas por props opcionales y callbacks.
  coverageThreshold: {
    global: {
      statements: 95,
      lines: 95,
      branches: 84,
      functions: 68,
    },
  },
}

// createJestConfig exporta de forma asíncrona esto aseguralo para Next.js
export default createJestConfig(config)
