// __tests__/TestsIndexScreen.test.js

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import TestsIndexScreen from '../app/tests/index';

// Mock all dependencies
jest.mock('@/components/ScreenContainer', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children }) => <View>{children}</View>,
  };
});

jest.mock('@/components/themed-text', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children }) => <Text>{children}</Text>,
  };
});

jest.mock('@/components/themed-view', () => {
  const { View } = require('react-native');
  return {
    ThemedView: ({ children }) => <View>{children}</View>,
  };
});

jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: () => '#000000',
}));

jest.mock('expo-router', () => ({
  Link: ({ children }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/constants/theme', () => ({
  BorderRadius: { md: 8 },
  Spacing: { md: 16, lg: 24, sm: 8, xs: 4, xl: 32 },
  typographySizes: { small: { fontSize: 12 } },
}));

describe('TestsIndexScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<TestsIndexScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders the Component Tests title', () => {
    render(<TestsIndexScreen />);
    const title = screen.getByText('Component Tests');
    expect(title).toBeTruthy();
  });

  it('renders the description text', () => {
    render(<TestsIndexScreen />);
    const description = screen.getByText(/Visual test pages for components/i);
    expect(description).toBeTruthy();
  });

  it('renders the ThemedText Component link text', () => {
    render(<TestsIndexScreen />);
    const linkText = screen.getByText('ThemedText Component');
    expect(linkText).toBeTruthy();
  });
});