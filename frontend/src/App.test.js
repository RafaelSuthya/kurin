import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Mock minimal react-router-dom to avoid module resolution issues in tests
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: () => <div data-testid="route" />,
  Navigate: () => <div data-testid="navigate" />,
}), { virtual: true });

// Mock axios ESM to avoid Jest ESM parsing issues
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }),
}), { virtual: true });

test('renders App without crashing', () => {
  expect(() => render(<App />)).not.toThrow();
});
