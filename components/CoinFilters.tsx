// components/CoinFilters.tsx
// UI component for selecting and activating coin filters

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SectionContainer } from "@/components/SectionContainer";
import { AVAILABLE_FILTERS } from "@/utils/coinFilters";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, Pressable } from "react-native";

interface CoinFiltersProps {
  activeFilterIds: string[];
  onFilterToggle: (filterId: string) => void;
}

export function CoinFilters({
  activeFilterIds,
  onFilterToggle,
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
          return (
            <Pressable
              key={filter.id}
              onPress={() => onFilterToggle(filter.id)}
              style={[
                styles.filterButton,
                {
                  borderColor: isActive ? tintColor : borderColor,
                  backgroundColor: isActive ? backgroundSecondary : backgroundColor,
                },
              ]}
            >
              <ThemedView style={styles.filterContent}>
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
                  <ThemedText type="small" variant="secondary" style={styles.filterDescription}>
                    {filter.description}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </Pressable>
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
  filterDescription: {
    fontSize: 12,
  },
});

