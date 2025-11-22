// components/DominanceMomentumWidget.tsx
/*
What It Measures:
The metric calculates the percentage change in the BTC-to-ETH dominance ratio over the past 7 days.

Interpretation:
  Positive Momentum: Risk-off environment, favoring BTC dominance.
  Negative Momentum: Altcoin Season precursor - shift toward large-cap altcoins.
  Neutral Momentum: Stable dominance ratio.
*/

import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet } from "react-native";

import { SectionContainer } from "@/components/SectionContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BACKEND_DOMINANCE_QUERY_KEY } from "@/constants/misc";
import { Spacing } from "@/constants/theme";
import {
  calculateAll7DayRatioChanges,
  useCalculatePercentageChange
} from "@/hooks/use-dominance-calculations";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  fetchHistoricalDominance,
  HistoricalDominanceSnapshot,
} from "@/utils/backendApi";

// --- CONSTANTS ---

// Timing
const STALE_TIME_HOURS = 24;
const STALE_TIME_MS = STALE_TIME_HOURS * 60 * 60 * 1000;

// Data Requirements
const MIN_DATA_POINTS_REQUIRED = 7; // Minimum days needed to calculate 7-day change

// Display Formatting
const DECIMAL_PLACES = 2; // Number of decimal places for percentage display
const STATISTICS_PERIOD_DAYS = 180; // Period for statistics calculation

// Layout Constants
const TWO_COLUMN_MIN_HEIGHT = 80; // Minimum height for two-column layout vertical centering
const STAT_ITEM_MIN_WIDTH = 100; // Minimum width for statistics items

// Styling Constants
const BORDER_COLOR = '#a9a9a9'; // Color for separators and borders
const FONT_WEIGHT_SEMIBOLD = '600'; // Font weight for semibold text
const FONT_WEIGHT_MEDIUM = '500'; // Font weight for medium text

// Date Formatting Options
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric"
};

// Text Constants
const INTERPRETATION_POSITIVE = "Risk-off environment, favoring BTC dominance";
const INTERPRETATION_NEGATIVE = "Altcoin Season precursor - shift toward large-cap altcoins";
const INTERPRETATION_NEUTRAL = "Neutral - stable dominance ratio";
const DESCRIPTION_POSITIVE = "BTC/ETH ratio accelerating toward BTC";
const DESCRIPTION_NEGATIVE = "BTC/ETH ratio accelerating toward ETH";
const STATS_TITLE_PREFIX = "180-Day Statistics";
const STAT_LABEL_MIN = "Minimum";
const STAT_LABEL_MAX = "Maximum";
const STAT_LABEL_AVG = "Average";
const STAT_INTERPRETATION_MIN = "Most extreme rotation toward ETH/altcoins in the period";
const STAT_INTERPRETATION_MAX = "Most extreme rotation toward BTC/risk-off in the period";
const STAT_INTERPRETATION_AVG_POSITIVE = "Overall trend favors BTC dominance";
const STAT_INTERPRETATION_AVG_NEGATIVE = "Overall trend favors ETH/altcoin rotation";
const STAT_INTERPRETATION_AVG_NEUTRAL = "Balanced momentum over the period";
const LOADING_TEXT = "Loading momentum data...";
const TITLE_TEXT = "Dominance Momentum";
const LABEL_7_DAY_CHANGE = "7-Day Change";

interface DominanceMomentumWidgetProps {
  extendedInfo?: boolean;
}

export function DominanceMomentumWidget({ extendedInfo = false }: DominanceMomentumWidgetProps) {
  const { data: historicalDominance, isPending } = useQuery<
    HistoricalDominanceSnapshot[]
  >({
    queryKey: BACKEND_DOMINANCE_QUERY_KEY,
    queryFn: fetchHistoricalDominance,
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  // Calculate the current change using the hook
  const { currentChange } = useCalculatePercentageChange(
    historicalDominance,
    successColor,
    errorColor
  );

  // Calculate all 7-day ratio changes statistics
  const stats = calculateAll7DayRatioChanges(historicalDominance);

  // Determine interpretation
  const isPositive = currentChange > 0;
  const interpretation =
    currentChange > 0
      ? INTERPRETATION_POSITIVE
      : currentChange < 0
      ? INTERPRETATION_NEGATIVE
      : INTERPRETATION_NEUTRAL;

  if (isPending) {
    return (
      <SectionContainer marginBottom={Spacing.md}>
        <ActivityIndicator size="small" />
        <ThemedText type="body" variant="secondary" style={styles.loadingText}>
          {LOADING_TEXT}
        </ThemedText>
      </SectionContainer>
    );
  }

  if (!historicalDominance || historicalDominance.length < MIN_DATA_POINTS_REQUIRED) {
    return null; // Not enough data
  }

  const changeColor = isPositive ? successColor : errorColor;
  const sign = currentChange > 0 ? "+" : "";

  return (
    <SectionContainer marginBottom={Spacing.md}>
      <ThemedText type="subtitle" style={styles.title}>
        {TITLE_TEXT}
      </ThemedText>
      
      {/* Current 7-Day Change - Two Column Layout */}
      <ThemedView style={styles.twoColumnContainer}>
        <ThemedView style={styles.leftColumn}>
          <ThemedText
            type="title"
            style={[styles.value, { color: changeColor }]}
          >
            {sign}
            {currentChange.toFixed(DECIMAL_PLACES)}%
          </ThemedText>
          <ThemedText type="small" variant="secondary" style={styles.label}>
            {LABEL_7_DAY_CHANGE}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.separator} />
        <ThemedView style={styles.rightColumn}>
          <ThemedText type="bodySemibold" style={styles.interpretation}>
            {interpretation}
          </ThemedText>
          <ThemedText type="small" style={styles.description}>
            {isPositive
              ? DESCRIPTION_POSITIVE
              : DESCRIPTION_NEGATIVE}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Extended Statistics Section - Only shown when extendedInfo is true */}
      {extendedInfo && stats.count > 0 && (
        <ThemedView style={styles.statsSection}>
          <ThemedText type="body" variant="secondary" style={styles.statsTitle}>
            {STATS_TITLE_PREFIX} ({stats.count} valid periods)
          </ThemedText>
          <ThemedView style={styles.statsGrid}>
            <ThemedView style={styles.statItem}>
              <ThemedText type="small" variant="secondary" style={styles.statLabel}>
                {STAT_LABEL_MIN}
              </ThemedText>
              <ThemedText type="body" style={[styles.statValue, { color: errorColor }]}>
                {stats.min < 0 ? '' : '+'}{stats.min.toFixed(DECIMAL_PLACES)}%
              </ThemedText>
              {stats.minDate && (
                <ThemedText type="xsmall" style={styles.statDate}>
                  {new Date(stats.minDate).toLocaleDateString("en-US", DATE_FORMAT_OPTIONS)}
                </ThemedText>
              )}
              <ThemedText type="xsmall" variant="secondary" style={styles.statInterpretation}>
                {STAT_INTERPRETATION_MIN}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText type="small" variant="secondary" style={styles.statLabel}>
                {STAT_LABEL_MAX}
              </ThemedText>
              <ThemedText type="body" style={[styles.statValue, { color: successColor }]}>
                {stats.max < 0 ? '' : '+'}{stats.max.toFixed(DECIMAL_PLACES)}%
              </ThemedText>
              {stats.maxDate && (
                <ThemedText type="xsmall" style={styles.statDate}>
                  {new Date(stats.maxDate).toLocaleDateString("en-US", DATE_FORMAT_OPTIONS)}
                </ThemedText>
              )}
              <ThemedText type="xsmall" variant="secondary" style={styles.statInterpretation}>
                {STAT_INTERPRETATION_MAX}
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText type="small" variant="secondary" style={styles.statLabel}>
                {STAT_LABEL_AVG}
              </ThemedText>
              <ThemedText type="body" style={styles.statValue}>
                {stats.average < 0 ? '' : '+'}{stats.average.toFixed(DECIMAL_PLACES)}%
              </ThemedText>
              <ThemedText type="xsmall" variant="secondary" style={styles.statInterpretation}>
                {stats.average > 0 
                  ? STAT_INTERPRETATION_AVG_POSITIVE
                  : stats.average < 0
                  ? STAT_INTERPRETATION_AVG_NEGATIVE
                  : STAT_INTERPRETATION_AVG_NEUTRAL}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}
    </SectionContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.sm,
  },
  twoColumnContainer: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    minHeight: TWO_COLUMN_MIN_HEIGHT,
  },
  leftColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: BORDER_COLOR,
    marginHorizontal: Spacing.md,
  },
  rightColumn: {
    flex: 1,
    justifyContent: "center",
  },
  value: {
    marginBottom: Spacing.xs,
  },
  label: {
    marginTop: Spacing.xs,
  },
  interpretation: {
    textAlign: "left",
    fontStyle: "italic",
    marginBottom: Spacing.xs,
  },
  description: {
    textAlign: "left",
  },
  statsSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER_COLOR,
  },
  statsTitle: {
    marginBottom: Spacing.sm,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: STAT_ITEM_MIN_WIDTH,
  },
  statLabel: {
    marginBottom: Spacing.xs / 2,
  },
  statValue: {
    fontWeight: FONT_WEIGHT_SEMIBOLD,
    marginBottom: Spacing.xs / 2,
  },
  statDate: {
    marginBottom: Spacing.xs / 2,
    fontWeight: FONT_WEIGHT_MEDIUM,
  },
  statInterpretation: {
    marginTop: Spacing.xs / 2,
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});

