// __tests__/ThemedText.test.js

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { ThemedText } from '../components/themed-text';

// Mock the theme constants
jest.mock('@/constants/theme', () => ({
  typographySizes: {
    default: { fontSize: 16, lineHeight: 24 },
    title: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
    subtitle: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    link: { fontSize: 16, lineHeight: 24, textDecorationLine: 'underline' },
  },
}));

// Mock the theme color hook
jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: () => '#000000',
}));

describe('ThemedText', () => {
  it('renders text content', () => {
    render(<ThemedText>Hello World</ThemedText>);
    const text = screen.getByText('Hello World');
    expect(text).toBeTruthy();
  });

  it('renders with default type', () => {
    const { toJSON } = render(<ThemedText>Default Text</ThemedText>);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with title type', () => {
    render(<ThemedText type="title">Title Text</ThemedText>);
    const text = screen.getByText('Title Text');
    expect(text).toBeTruthy();
  });

  it('renders with subtitle type', () => {
    render(<ThemedText type="subtitle">Subtitle Text</ThemedText>);
    const text = screen.getByText('Subtitle Text');
    expect(text).toBeTruthy();
  });

  it('renders with link type', () => {
    render(<ThemedText type="link">Link Text</ThemedText>);
    const text = screen.getByText('Link Text');
    expect(text).toBeTruthy();
  });

  it('applies custom style prop', () => {
    const customStyle = { fontSize: 20 };
    const { toJSON } = render(
      <ThemedText style={customStyle}>Styled Text</ThemedText>
    );
    expect(toJSON()).toBeTruthy();
  });
});