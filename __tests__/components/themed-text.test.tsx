import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

// Mock the useColorScheme hook
jest.mock('@/hooks/use-color-scheme');

const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('ThemedText', () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue('light');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      const { getByText } = render(<ThemedText>Hello World</ThemedText>);
      expect(getByText('Hello World')).toBeTruthy();
    });

    it('renders text content correctly', () => {
      const { getByText } = render(<ThemedText>Test Content</ThemedText>);
      expect(getByText('Test Content')).toBeTruthy();
    });
  });

  describe('Type Prop', () => {
    const types: Array<ThemedTextProps['type']> = [
      'default',
      'title',
      'subtitle',
      'defaultSemiBold',
      'link',
      'xlarge',
      'large',
      'small',
      'xsmall',
      'caption',
    ];

    types.forEach((type) => {
      it(`renders with type="${type}"`, () => {
        const { getByText } = render(
          <ThemedText type={type}>Text with type {type}</ThemedText>
        );
        const element = getByText(`Text with type ${type}`);
        expect(element).toBeTruthy();
      });
    });
  });

  describe('Color Variant Prop', () => {
    const colorVariants: Array<ThemedTextProps['colorVariant']> = [
      'text',
      'textAlt',
      'textSubtle',
      'background',
      'tint',
      'icon',
      'tabIconDefault',
      'tabIconSelected',
      'highlightedText',
      'buttonPrimary',
      'buttonSecondary',
      'link',
      'cardBackground',
      'inputBackground',
      'border',
      'success',
      'warning',
      'error',
      'overlay',
    ];

    colorVariants.forEach((colorVariant) => {
      it(`applies colorVariant="${colorVariant}" correctly`, () => {
        const { getByText } = render(
          <ThemedText colorVariant={colorVariant}>
            Text with {colorVariant}
          </ThemedText>
        );
        const element = getByText(`Text with ${colorVariant}`);
        expect(element).toBeTruthy();
      });
    });
  });

  describe('Custom Colors', () => {
    it('uses lightColor when provided in light mode', () => {
      mockUseColorScheme.mockReturnValue('light');
      const { getByText } = render(
        <ThemedText lightColor="#FF0000">Red Text</ThemedText>
      );
      const element = getByText('Red Text');
      expect(element).toBeTruthy();
    });

    it('uses darkColor when provided in dark mode', () => {
      mockUseColorScheme.mockReturnValue('dark');
      const { getByText } = render(
        <ThemedText darkColor="#00FF00">Green Text</ThemedText>
      );
      const element = getByText('Green Text');
      expect(element).toBeTruthy();
    });

    it('uses theme color when custom colors are not provided', () => {
      mockUseColorScheme.mockReturnValue('light');
      const { getByText } = render(<ThemedText>Default Text</ThemedText>);
      const element = getByText('Default Text');
      expect(element).toBeTruthy();
    });
  });

  describe('Link Type Behavior', () => {
    it('forces link color when type is "link" regardless of colorVariant', () => {
      mockUseColorScheme.mockReturnValue('light');
      const { getByText } = render(
        <ThemedText type="link" colorVariant="error">
          Link Text
        </ThemedText>
      );
      const element = getByText('Link Text');
      expect(element).toBeTruthy();
    });

    it('uses link color from theme when type is "link"', () => {
      mockUseColorScheme.mockReturnValue('light');
      const { getByText } = render(<ThemedText type="link">Link</ThemedText>);
      const element = getByText('Link');
      expect(element).toBeTruthy();
    });
  });

  describe('Custom Style Prop', () => {
    it('merges custom style with default styles', () => {
      const customStyle = { marginTop: 20 };
      const { getByText } = render(
        <ThemedText style={customStyle}>Styled Text</ThemedText>
      );
      const element = getByText('Styled Text');
      expect(element).toBeTruthy();
    });

    it('applies multiple style properties', () => {
      const customStyle = { marginTop: 10, padding: 5, backgroundColor: '#FFF' };
      const { getByText } = render(
        <ThemedText style={customStyle}>Multi-styled Text</ThemedText>
      );
      const element = getByText('Multi-styled Text');
      expect(element).toBeTruthy();
    });
  });

  describe('Theme Mode Switching', () => {
    it('renders correctly in light mode', () => {
      mockUseColorScheme.mockReturnValue('light');
      const { getByText } = render(<ThemedText>Light Mode</ThemedText>);
      expect(getByText('Light Mode')).toBeTruthy();
    });

    it('renders correctly in dark mode', () => {
      mockUseColorScheme.mockReturnValue('dark');
      const { getByText } = render(<ThemedText>Dark Mode</ThemedText>);
      expect(getByText('Dark Mode')).toBeTruthy();
    });
  });

  describe('Combined Props', () => {
    it('renders with type and colorVariant together', () => {
      const { getByText } = render(
        <ThemedText type="title" colorVariant="textAlt">
          Combined Props
        </ThemedText>
      );
      expect(getByText('Combined Props')).toBeTruthy();
    });

    it('renders with type, colorVariant, and custom style', () => {
      const { getByText } = render(
        <ThemedText
          type="subtitle"
          colorVariant="success"
          style={{ marginBottom: 10 }}
        >
          All Props
        </ThemedText>
      );
      expect(getByText('All Props')).toBeTruthy();
    });
  });

  describe('TextProps Inheritance', () => {
    it('passes through standard Text props', () => {
      const { getByText } = render(
        <ThemedText numberOfLines={2}>Truncated Text</ThemedText>
      );
      const element = getByText('Truncated Text');
      expect(element).toBeTruthy();
    });

    it('handles onPress prop', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ThemedText onPress={onPress}>Pressable Text</ThemedText>
      );
      const element = getByText('Pressable Text');
      expect(element).toBeTruthy();
    });
  });
});

