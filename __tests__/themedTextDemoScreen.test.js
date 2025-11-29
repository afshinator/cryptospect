// __tests__/ThemedTextDemoScreen.test.js

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import ThemedTextDemoScreen from '../app/tests/themed-text-demo';

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

describe('ThemedTextDemoScreen', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<ThemedTextDemoScreen />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders the main title', () => {
    render(<ThemedTextDemoScreen />);
    const title = screen.getByText('ThemedText Component Demo');
    expect(title).toBeTruthy();
  });

  it('renders the description', () => {
    render(<ThemedTextDemoScreen />);
    const description = screen.getByText(/This page demonstrates all the different prop combinations/i);
    expect(description).toBeTruthy();
  });

  // Test Type Variants section
  it('renders Type Variants section header', () => {
    render(<ThemedTextDemoScreen />);
    const header = screen.getByText('Type Variants');
    expect(header).toBeTruthy();
  });

  it('renders xlarge type example', () => {
    render(<ThemedTextDemoScreen />);
    const xlarge = screen.getByText('xlarge - Extra Large Text');
    expect(xlarge).toBeTruthy();
  });

  it('renders title type example', () => {
    render(<ThemedTextDemoScreen />);
    const title = screen.getByText('title - Title Text');
    expect(title).toBeTruthy();
  });

  it('renders link type example', () => {
    render(<ThemedTextDemoScreen />);
    const link = screen.getByText('link - Link Text');
    expect(link).toBeTruthy();
  });

  // Test Color Variants section
  it('renders Color Variants section header', () => {
    render(<ThemedTextDemoScreen />);
    const header = screen.getByText('Color Variants');
    expect(header).toBeTruthy();
  });

  it('renders text color variant example', () => {
    render(<ThemedTextDemoScreen />);
    const text = screen.getByText('text - Default Text Color');
    expect(text).toBeTruthy();
  });

  it('renders success color variant example', () => {
    render(<ThemedTextDemoScreen />);
    const success = screen.getByText('success - Success Color');
    expect(success).toBeTruthy();
  });

  it('renders error color variant example', () => {
    render(<ThemedTextDemoScreen />);
    const error = screen.getByText('error - Error Color');
    expect(error).toBeTruthy();
  });

  // Test Type + Color Combinations section
  it('renders Type + Color Combinations section', () => {
    render(<ThemedTextDemoScreen />);
    const header = screen.getByText('Type + Color Combinations');
    expect(header).toBeTruthy();
  });

  it('renders title + textAlt combination', () => {
    render(<ThemedTextDemoScreen />);
    const combo = screen.getByText('title + textAlt');
    expect(combo).toBeTruthy();
  });

  // Test Custom Colors section
  it('renders Custom Colors section', () => {
    render(<ThemedTextDemoScreen />);
    const header = screen.getByText('Custom Colors');
    expect(header).toBeTruthy();
  });

  it('renders custom light/dark colors example', () => {
    render(<ThemedTextDemoScreen />);
    const custom = screen.getByText('Custom Light/Dark Colors');
    expect(custom).toBeTruthy();
  });

  // Test Custom Styles section
  it('renders Custom Styles section', () => {
    render(<ThemedTextDemoScreen />);
    const header = screen.getByText('Custom Styles');
    expect(header).toBeTruthy();
  });

  it('renders centered and bold example', () => {
    render(<ThemedTextDemoScreen />);
    const centered = screen.getByText('Centered and Bold');
    expect(centered).toBeTruthy();
  });

  // Test Complex Examples section
  it('renders Complex Examples section', () => {
    render(<ThemedTextDemoScreen />);
    const header = screen.getByText('Complex Examples');
    expect(header).toBeTruthy();
  });

  it('renders inline bold text example', () => {
    render(<ThemedTextDemoScreen />);
    const inline = screen.getByText('inline bold text');
    expect(inline).toBeTruthy();
  });

  it('renders success title example', () => {
    render(<ThemedTextDemoScreen />);
    const successTitle = screen.getByText('Success Title');
    expect(successTitle).toBeTruthy();
  });

  it('renders error caption example', () => {
    render(<ThemedTextDemoScreen />);
    const errorCaption = screen.getByText('Error caption text');
    expect(errorCaption).toBeTruthy();
  });
});