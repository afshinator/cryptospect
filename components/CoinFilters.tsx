// components/CoinFilters.tsx
// UI component for selecting and activating coin filters

import { SectionContainer } from "@/components/SectionContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { AVAILABLE_FILTERS } from "@/utils/coinFilters";
import { Pressable, StyleSheet } from "react-native";

interface CoinFiltersProps {
  activeFilterIds: string[];
  onFilterToggle: (filterId: string) => void;
  andFilterIds?: string[]; // Filters that should use AND logic
  onAndToggle?: (filterId: string) => void; // Toggle AND logic for a filter
}

export function CoinFilters({
  activeFilterIds,
  onFilterToggle,
  andFilterIds = [],
  onAndToggle,
}: CoinFiltersProps) {
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const backgroundSecondary = useThemeColor({}, "backgroundSecondary");
  const textColor = useThemeColor({}, "text");

  return (
    <SectionContainer marginBottom={Spacing.md}>
      <ThemedText type="subtitle" style={styles.title}>
        Filters and Analysis
      </ThemedText>
      <ThemedText type="small" variant="secondary" style={styles.description}>
        Select one or more filters to find matching coins across all your lists
      </ThemedText>

      <ThemedView style={styles.filtersContainer}>
        {AVAILABLE_FILTERS.map((filter) => {
          const isActive = activeFilterIds.includes(filter.id);
          const isAndEnabled = andFilterIds.includes(filter.id);
          return (
            <ThemedView
              key={filter.id}
              style={[
                styles.filterButton,
                {
                  borderColor: isActive ? tintColor : borderColor,
                  backgroundColor: isActive ? backgroundSecondary : backgroundColor,
                },
              ]}
            >
              <Pressable
                onPress={() => onFilterToggle(filter.id)}
                style={styles.filterContent}
              >
                <ThemedView
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isActive ? tintColor : borderColor,
                      backgroundColor: isActive ? tintColor : "transparent",
                    },
                  ]}
                >
                  {isActive && (
                    <ThemedText style={styles.checkmark} type="small">
                      ✓
                    </ThemedText>
                  )}
                </ThemedView>
                <ThemedView style={styles.filterTextContainer}>
                  <ThemedText
                    type="bodySemibold"
                    style={[
                      styles.filterName,
                      { color: isActive ? tintColor : textColor },
                    ]}
                  >
                    {filter.name}
                  </ThemedText>
                  <ThemedText type="body" variant="secondary">
                    {filter.description}
                  </ThemedText>
                </ThemedView>
              </Pressable>
              {isActive && onAndToggle && activeFilterIds.length > 1 && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onAndToggle(filter.id);
                  }}
                  style={[styles.andToggleContainer, { borderTopColor: borderColor }]}
                >
                  <ThemedView
                    style={[
                      styles.andCheckbox,
                      {
                        borderColor: isAndEnabled ? tintColor : borderColor,
                        backgroundColor: isAndEnabled ? tintColor : "transparent",
                      },
                    ]}
                  >
                    {isAndEnabled && (
                      <ThemedText style={styles.checkmark} type="xsmall">
                        &
                      </ThemedText>
                    )}
                  </ThemedView>
                  <ThemedText type="xsmall" variant="secondary" style={styles.andLabel}>
                    AND
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
          );
        })}
      </ThemedView>
    </SectionContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.md,
  },
  filtersContainer: {
    gap: Spacing.sm,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.sm,
  },
  filterContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#fff",
    fontWeight: "bold",
  },
  filterTextContainer: {
    flex: 1,
  },
  filterName: {
    marginBottom: Spacing.xs / 2,
  },
  andToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  andCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  andLabel: {
    marginLeft: Spacing.xs / 2,
  },
});

