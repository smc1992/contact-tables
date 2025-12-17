// Import @testing-library/jest-dom für erweiterte DOM-Matcher
require('@testing-library/jest-dom');

// Mock global fetch
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    pathname: '/admin/dashboard',
    query: {},
    asPath: '/admin/dashboard',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  })),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: 'img',
}));

// Suppress console errors during tests
console.error = jest.fn();
