import '@testing-library/jest-native/extend-expect';

// Mock useColorScheme hook
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

