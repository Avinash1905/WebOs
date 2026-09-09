import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

afterEach(() => {
  cleanup();
});

// Polyfill toBeInTheDocument and common DOM matchers for vitest
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined && (received.ownerDocument?.contains(received) ?? false);
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
    };
  },
  toHaveClass(received, className) {
    const pass = received && received.classList && received.classList.contains(className);
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to have class ${className}`,
    };
  },
  toHaveTextContent(received, text) {
    const pass = received && received.textContent && received.textContent.includes(text);
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to have text content ${text}`,
    };
  },
  toBeVisible(received) {
    const pass = received && received.style?.display !== 'none' && received.style?.visibility !== 'hidden';
    return {
      pass,
      message: () => `expected element ${pass ? 'not ' : ''}to be visible`,
    };
  },
});
