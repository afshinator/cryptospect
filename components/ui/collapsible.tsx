import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CollapsibleComponentProps = PropsWithChildren & {
  title: string;
  // The new optional prop to set the initial open/closed state.
  isOpen?: boolean; 
  // NEW: Optional prop to hide the chevron icon and its spacing.
  hideChevron?: boolean;
};

// The prop 'hideChevron' is destructured and given a default value of 'false'.
export function Collapsible({ 
    children, 
    title, 
    isOpen: initialOpen = false,
    hideChevron = false 
}: CollapsibleComponentProps) {
  // The internal state now initializes based on the 'initialOpen' value.
  const [isOpen, setIsOpen] = useState(initialOpen);
  const theme = useColorScheme() ?? 'light';

  // Calculate content margin: 24px (standard chevron size + gap) or 0px.
  const contentMarginLeft = hideChevron ? 0 : 24;

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        
        {/* Conditional rendering of the chevron */}
        {!hideChevron && (
          <IconSymbol
            name="chevron.right"
            size={18}
            weight="medium"
            color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
            style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
          />
        )}

        <ThemedText type="bodySemibold">{title}</ThemedText>
      </TouchableOpacity>
      
      {/* Conditional content rendering with dynamic margin */}
      {isOpen && (
        <ThemedView style={[styles.content, { marginLeft: contentMarginLeft }]}>
          {children}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Gap only applies if the chevron is present due to flex layout
  },
  content: {
    marginTop: 6,
    // marginLeft is now calculated dynamically in the component function
  },
});