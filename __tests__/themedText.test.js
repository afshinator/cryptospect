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

// Mock the Zustand store hook for fontScale
let mockFontScale = 1.0;
jest.mock('@/stores/prefsStore', () => ({
  usePrefsStore: jest.fn((selector) => selector({ fontScale: mockFontScale })),
}));

describe('ThemedText', () => {
  const BASE_FONT_SIZE = 16;
  const TEST_CONTENT = 'Text Content';

  it('renders text content', () => {
    render(<ThemedText>{TEST_CONTENT}</ThemedText>);
    const text = screen.getByText(TEST_CONTENT);
    expect(text).toBeTruthy();
  });

  it('renders with default type', () => {
    const { toJSON } = render(<ThemedText>{TEST_CONTENT}</ThemedText>);
    expect(toJSON()).toBeTruthy();
  });

  it('applies custom style prop', () => {
    const customStyle = { fontSize: 20 };
    const { toJSON } = render(
      <ThemedText style={customStyle}>{TEST_CONTENT}</ThemedText>
    );
    expect(toJSON()).toBeTruthy();
  });
  
  // 📏 Font Scaling Tests
  describe('Font Scaling', () => {
    beforeEach(() => {
      // Reset mockFontScale before each scaling test
      mockFontScale = 1.0; 
    });

    it('applies no scaling when fontScale is 1.0 (default)', () => {
      const { getByText } = render(<ThemedText type="default">{TEST_CONTENT}</ThemedText>);
      const textElement = getByText(TEST_CONTENT);
      
      expect(textElement.props.style).toEqual(
        expect.objectContaining({ fontSize: BASE_FONT_SIZE })
      );
    });

    it('scales up the font size correctly when global fontScale is 1.5', () => {
      mockFontScale = 1.5;
      const EXPECTED_SIZE = BASE_FONT_SIZE * 1.5; // 24
      
      const { getByText } = render(<ThemedText type="default">{TEST_CONTENT}</ThemedText>);
      const textElement = getByText(TEST_CONTENT);

      expect(textElement.props.style).toEqual(
        expect.objectContaining({ fontSize: EXPECTED_SIZE })
      );
    });

    it('scales down the font size correctly when global fontScale is 0.5', () => {
      mockFontScale = 0.5;
      const EXPECTED_SIZE = BASE_FONT_SIZE * 0.5; // 8
      
      const { getByText } = render(<ThemedText type="default">{TEST_CONTENT}</ThemedText>);
      const textElement = getByText(TEST_CONTENT);

      expect(textElement.props.style).toEqual(
        expect.objectContaining({ fontSize: EXPECTED_SIZE })
      );
    });
  });
  // 📏 Font Scaling Tests

  // 📐 Extra Scaling prop feature
  describe('Extra Scaling prop feature', () => {
    const EXTRA_SCALE = 2.0;
    const TEST_CONTENT_EXTRA = 'Extra Scaled Text';

    beforeEach(() => {
      // Reset global scale to 1.0 for control tests
      mockFontScale = 1.0;
    });

    it('applies fontScaleExtra on top of default global scale (1.0)', () => {
      const EXPECTED_SIZE = BASE_FONT_SIZE * EXTRA_SCALE; // 16 * 2.0 = 32

      const { getByText } = render(
        <ThemedText type="default" fontScaleExtra={EXTRA_SCALE}>
          {TEST_CONTENT_EXTRA}
        </ThemedText>
      );
      const textElement = getByText(TEST_CONTENT_EXTRA);

      expect(textElement.props.style).toEqual(
        expect.objectContaining({ fontSize: EXPECTED_SIZE })
      );
    });

    it('multiplies fontScaleExtra with an existing global fontScale (1.5)', () => {
      mockFontScale = 1.5; // Global scale is 1.5
      const EXPECTED_SIZE = BASE_FONT_SIZE * mockFontScale * EXTRA_SCALE; // 16 * 1.5 * 2.0 = 48

      const { getByText } = render(
        <ThemedText type="default" fontScaleExtra={EXTRA_SCALE}>
          {TEST_CONTENT_EXTRA}
        </ThemedText>
      );
      const textElement = getByText(TEST_CONTENT_EXTRA);

      expect(textElement.props.style).toEqual(
        expect.objectContaining({ fontSize: EXPECTED_SIZE })
      );
    });

    it('defaults to 1.0 when fontScaleExtra prop is omitted', () => {
      // Global scale is 1.0
      const { getByText } = render(
        <ThemedText type="default">
          {TEST_CONTENT_EXTRA}
        </ThemedText>
      );
      const textElement = getByText(TEST_CONTENT_EXTRA);

      // Should just be the base size
      expect(textElement.props.style).toEqual(
        expect.objectContaining({ fontSize: BASE_FONT_SIZE })
      );
    });
  });
  // 📐 Extra Scaling prop feature
});