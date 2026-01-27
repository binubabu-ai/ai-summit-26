/**
 * Jest test setup
 * This file runs before all tests
 */

// Set test environment variables
(process.env as any).NODE_ENV = 'test';
(process.env as any).DEBUG = 'false';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock ES modules that cause issues in Jest
jest.mock('figures', () => ({
  tick: '✓',
  cross: '✗',
  arrowRight: '→',
  info: 'ℹ',
  warning: '⚠',
  bullet: '•',
}));

jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    text: '',
  }));
});

jest.mock('boxen', () => jest.fn((text) => text));

jest.mock('chalk', () => ({
  default: {
    green: jest.fn((text) => text),
    red: jest.fn((text) => text),
    yellow: jest.fn((text) => text),
    blue: jest.fn((text) => text),
    cyan: jest.fn((text) => text),
    dim: jest.fn((text) => text),
    bold: jest.fn((text) => text),
  },
  green: jest.fn((text) => text),
  red: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
  dim: jest.fn((text) => text),
  bold: jest.fn((text) => text),
}));
