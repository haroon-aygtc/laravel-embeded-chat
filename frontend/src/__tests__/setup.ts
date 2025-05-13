import '@testing-library/jest-dom';
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with Testing Library matchers
expect.extend(matchers);

// Automatically clean up after each test
afterEach(() => {
    cleanup();
}); 