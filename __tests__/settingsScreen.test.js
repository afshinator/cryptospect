// __tests__/SettingsScreen.test.js

import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import SettingsScreen from '../app/(tabs)/settings';

// --- MOCK DEPENDENCIES ---

// 1. Mock the usePrefsStore with Jest spies for action verification
const mockSetLightDarkMode = jest.fn();
const mockSetFontScale = jest.fn();
const mockSetCurrency = jest.fn();
const mockSetCompactMode = jest.fn();

// This object will hold the current state of the mock store
let mockStoreState = {
  lightDarkMode: 'system',
  fontScale: 1.0,
  currency: 'usd',
  compactMode: false,
  setLightDarkMode: mockSetLightDarkMode,
  setFontScale: mockSetFontScale,
  setCurrency: mockSetCurrency,
  setCompactMode: mockSetCompactMode,
};

jest.mock('@/stores/prefsStore', () => ({
  // Handle both selector (function) and full store (no selector) calls
  usePrefsStore: jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStoreState);
    }
    // Return the entire state object if no selector is provided
    return mockStoreState;
  }),
}));

// 2. Mock Themed components to simplify testing
jest.mock('@/components/ScreenContainer', () => {
  const { View } = require('react-native');
  return { ScreenContainer: ({ children }) => <View>{children}</View> };
});

jest.mock('@/components/themed-text', () => {
  const { Text } = require('react-native');
  return { ThemedText: ({ children, ...props }) => <Text {...props}>{children}</Text> };
});

jest.mock('@/components/themed-view', () => {
  const { View } = require('react-native');
  return { ThemedView: ({ children }) => <View>{children}</View> };
});


// Helper to reset the store state before each test
const setup = (initialState = {}) => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Set the initial state for the next render
  mockStoreState = {
    ...mockStoreState,
    ...initialState,
    setLightDarkMode: mockSetLightDarkMode,
    setFontScale: mockSetFontScale,
    setCurrency: mockSetCurrency,
    setCompactMode: mockSetCompactMode,
  };
};

// --- TESTS ---

describe('SettingsScreen', () => {
  // Ensure basic rendering works
  it('renders the title and all section headers', () => {
    setup();
    render(<SettingsScreen />);
    
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Theme Mode')).toBeTruthy();
    expect(screen.getByText('Font Scale: 1.0x')).toBeTruthy();
    expect(screen.getByText('Currency')).toBeTruthy();
    expect(screen.getByText('Compact Mode')).toBeTruthy();
  });

  // 🌙 Theme Mode Tests
  describe('Theme Mode Selector', () => {
    it('shows the current active mode (light)', () => {
      setup({ lightDarkMode: 'light' });
      render(<SettingsScreen />);

      // Check if the 'Light' button is rendered
      expect(screen.getByText('Light')).toBeTruthy();
    });

    it('calls setLightDarkMode with "dark" when the Dark button is pressed', () => {
      setup({ lightDarkMode: 'light' }); // Start in 'light'
      render(<SettingsScreen />);
      
      const darkButton = screen.getByText('Dark');
      fireEvent.press(darkButton);

      expect(mockSetLightDarkMode).toHaveBeenCalledWith('dark');
      expect(mockSetLightDarkMode).toHaveBeenCalledTimes(1);
    });
  });

  // 🔠 Font Scale Tests
  describe('Font Scale Selector', () => {
    it('displays the current font scale value in the section title', () => {
      setup({ fontScale: 1.25 });
      render(<SettingsScreen />);

      expect(screen.getByText('Font Scale: 1.3x')).toBeTruthy(); // 1.25.toFixed(1) is 1.3
    });

    it('calls setFontScale with 1.5 when the 1.5x button is pressed', () => {
      setup({ fontScale: 1.0 }); // Start at 1.0
      render(<SettingsScreen />);
      
      const scaleButton = screen.getByText('1.5x'); 
      fireEvent.press(scaleButton);

      expect(mockSetFontScale).toHaveBeenCalledWith(1.5);
      expect(mockSetFontScale).toHaveBeenCalledTimes(1);
    });
  });
  
  // 💵 Currency Selector Tests
  describe('Currency Selector', () => {
    it('shows the current active currency (EUR)', () => {
      setup({ currency: 'eur' });
      render(<SettingsScreen />);

      // Check for the rendered button text in uppercase
      expect(screen.getByText('EUR')).toBeTruthy();
    });

    it('calls setCurrency with "jpy" when the JPY button is pressed', () => {
      setup({ currency: 'usd' });
      render(<SettingsScreen />);

      const jpyButton = screen.getByText('JPY');
      fireEvent.press(jpyButton);

      expect(mockSetCurrency).toHaveBeenCalledWith('jpy');
      expect(mockSetCurrency).toHaveBeenCalledTimes(1);
    });

    it.each(['USD', 'EUR', 'GBP'])('renders button for %s currency', (curr) => {
      setup();
      render(<SettingsScreen />);
      expect(screen.getByText(curr)).toBeTruthy();
    });
  });

  // 📝 Compact Mode Tests
  describe('Compact Mode Switch', () => {
    it('displays the description text', () => {
      setup();
      render(<SettingsScreen />);
      
      expect(screen.getByText(/Reduce spacing and padding for a more compact layout/i)).toBeTruthy();
    });

    it('calls setCompactMode when the switch is toggled', () => {
      setup({ compactMode: false });
      render(<SettingsScreen />);
      
      // Find the Switch component using its accessibility role.
      const compactModeSwitch = screen.getByRole('switch');
      
      // Simulate toggle press
      fireEvent(compactModeSwitch, 'valueChange', true);

      // Verify that setCompactMode was called with the new value
      expect(mockSetCompactMode).toHaveBeenCalledWith(true);
      expect(mockSetCompactMode).toHaveBeenCalledTimes(1);
    });

    it('displays the correct initial value (true)', () => {
      setup({ compactMode: true });
      render(<SettingsScreen />);
      
      // Find the Switch component using its accessibility role.
      const compactModeSwitch = screen.getByRole('switch');
      
      // Inspect the props of the underlying component (Switch)
      expect(compactModeSwitch.props.value).toBe(true);
    });
  });
});