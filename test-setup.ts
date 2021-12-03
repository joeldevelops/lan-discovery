import * as winston from 'winston';

// Disable console logging during tests.
// @ts-ignore
global.console = {
  log: jest.fn(),
  error: jest.fn()
};

winston.loggers.add('app-logger', {
  level: 'warn',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console()
  ]
})