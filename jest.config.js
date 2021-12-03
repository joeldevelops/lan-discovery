module.exports = {
  roots: ['<rootDir>/test'],
  setupFiles: ['<rootDir>/test-setup.ts'],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules'
  ],
  collectCoverageFrom: [
    '<rootDir>/src/**',
    '!<rootDir>/src/config.ts',
    '!<rootDir>/src/lan-discovery.ts',
    '!<rootDir>/src/server.ts',
    '!<rootDir>/src/nics/nics.controller.ts',
  ]
}