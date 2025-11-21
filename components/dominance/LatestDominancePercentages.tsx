// components/dominance/LatestDominancePercentages.tsx

/*
Displays cryptocurrency market dominance percentages.

  - Shows BTC and ETH dominance by default (in a 2-column grid)
  - Optionally shows all 4 categories (BTC, ETH, Stablecoins, Others) when showAllFour={true}
  - Handles responsive layout (single row on wide screens, 2x2 grid when needed)
  - Displays a "Last Updated" timestamp
  - Accepts external data via props or calculates from the useAppInitialization hook
  - The component calculates dominance from CoinGecko's global market data, extracting BTC, ETH, and stablecoin (USDT, USDC, BUSD, DAI) percentages, with "Others" calculated as the remainder.
*/

const EXPECTED_SINGLE_ROW_HEIGHT = 80;

const TIME_FORMAT_OPTIONS = {
  hour: '2-digit' as const,
  minute: '2-digit' as const,
  second: '2-digit' as const,
} as const;

const TIME_FORMAT_OPTIONS_MOBILE = {
  hour: '2-digit' as const,
  minute: '2-digit' as const,
} as const;

const CARD_BORDER_RADIUS = 8;
const CARD_MIN_WIDTH = '45%';
const ROW_ITEM_MIN_WIDTH = '20%';

import { SectionContainer } from "@/components/SectionContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { useTextWrappingDetection } from "@/hooks/use-text-wrapping-detection";
import { calculateDominance } from "@/utils/cryptoDominance";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { DominanceNumberDisplay } from "./DominanceNumberDisplay";

interface LatestDominancePercentagesProps {
  btcDominance?: number;
  ethDominance?: number;
  stablecoinsDominance?: number;
  othersDominance?: number;
  date?: string;
  showAllFour?: boolean;
}

export function LatestDominancePercentages({
  btcDominance,
  ethDominance,
  stablecoinsDominance,
  othersDominance,
  date,
  showAllFour = false,
}: LatestDominancePercentagesProps = {}) {
  const { cryptoOverview, cryptoMarket, isCryptoOverviewPending } = useAppInitialization();
  const colorScheme = useColorScheme();
  
  const dominance = btcDominance !== undefined && ethDominance !== undefined
    ? {
        btc: btcDominance,
        eth: ethDominance,
        stablecoins: stablecoinsDominance ?? 0,
        others: othersDominance ?? 0,
      }
    : calculateDominance(cryptoOverview, cryptoMarket);

  const btcColor = colorScheme === "dark" ? Colors.dark.btc : Colors.light.btc;
  const ethColor = colorScheme === "dark" ? Colors.dark.eth : Colors.light.eth;

  const { useTwoRows, hasMeasured, handleLayout: handleRowLayout } = useTextWrappingDetection({
    enabled: showAllFour,
    expectedSingleRowHeight: EXPECTED_SINGLE_ROW_HEIGHT,
    dependencies: [
      dominance?.btc,
      dominance?.eth,
      dominance?.stablecoins,
      dominance?.others,
    ],
  });

  const getLastUpdated = () => {
    if (date) return date;
    if (!cryptoOverview?.timestamp) return null;
    const timestamp = new Date(cryptoOverview.timestamp);
    const isMobile = Platform.OS !== 'web';
    const formatOptions = isMobile ? TIME_FORMAT_OPTIONS_MOBILE : TIME_FORMAT_OPTIONS;
    return timestamp.toLocaleTimeString([], formatOptions);
  };

  const isMobile = Platform.OS !== 'web';

  if (!dominance) {
    return (
      <SectionContainer>
        <View style={styles.header}>
          <ThemedText type="subtitle">
            Current Coin Dominance
          </ThemedText>
          {getLastUpdated() && (
            <ThemedText type="xsmall" variant="secondary">
              {isMobile ? getLastUpdated() : `Updated: ${getLastUpdated()}`}
            </ThemedText>
          )}
        </View>
        {isCryptoOverviewPending ? (
          <ThemedText type="small" variant="secondary">
            Loading dominance data...
          </ThemedText>
        ) : (
          <ThemedText type="small" variant="secondary">
            Unable to load dominance data
          </ThemedText>
        )}
      </SectionContainer>
    );
  }

  if (showAllFour) {
    if (!hasMeasured) {
      return (
        <SectionContainer>
          <View style={styles.header}>
            <ThemedText type="subtitle">
              Current Coin Dominance
            </ThemedText>
            {getLastUpdated() && (
              <ThemedText type="xsmall" variant="secondary">
                {isMobile ? getLastUpdated() : `Updated: ${getLastUpdated()}`}
              </ThemedText>
            )}
          </View>
          <View style={styles.row} onLayout={handleRowLayout}>
            <DominanceNumberDisplay
              type="btc"
              value={dominance.btc}
              color={btcColor}
              containerStyle={styles.rowItem}
            />
            <DominanceNumberDisplay
              type="eth"
              value={dominance.eth}
              color={ethColor}
              containerStyle={styles.rowItem}
            />
            <DominanceNumberDisplay
              type="stablecoins"
              value={dominance.stablecoins}
              containerStyle={styles.rowItem}
            />
            <DominanceNumberDisplay
              type="others"
              value={dominance.others}
              containerStyle={styles.rowItem}
            />
          </View>
        </SectionContainer>
      );
    }

    const containerStyle = useTwoRows ? styles.twoRowGrid : styles.row;
    const itemStyle = useTwoRows ? styles.twoRowItem : styles.rowItem;

    return (
      <SectionContainer>
        <View style={styles.header}>
          <ThemedText type="subtitle">
            Current Coin Dominance
          </ThemedText>
          {getLastUpdated() && (
            <ThemedText type="xsmall" variant="secondary">
              {isMobile ? getLastUpdated() : `Updated: ${getLastUpdated()}`}
            </ThemedText>
          )}
        </View>
        <View style={containerStyle}>
          <DominanceNumberDisplay
            type="btc"
            value={dominance.btc}
            color={btcColor}
            containerStyle={itemStyle}
          />
          <DominanceNumberDisplay
            type="eth"
            value={dominance.eth}
            color={ethColor}
            containerStyle={itemStyle}
          />
          <DominanceNumberDisplay
            type="stablecoins"
            value={dominance.stablecoins}
            containerStyle={itemStyle}
          />
          <DominanceNumberDisplay
            type="others"
            value={dominance.others}
            containerStyle={itemStyle}
          />
        </View>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      <View style={styles.header}>
        <ThemedText type="subtitle">
          Current Coin Dominance
        </ThemedText>
        {getLastUpdated() && (
          <ThemedText type="xsmall" variant="secondary">
            Updated: {getLastUpdated()}
          </ThemedText>
        )}
      </View>
      <View style={styles.grid}>
        <ThemedView style={styles.card}>
          <DominanceNumberDisplay
            type="btc"
            value={dominance.btc}
            color={btcColor}
          />
        </ThemedView>
        <ThemedView style={styles.card}>
          <DominanceNumberDisplay
            type="eth"
            value={dominance.eth}
            color={ethColor}
          />
        </ThemedView>
      </View>
    </SectionContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  card: {
    flex: 1,
    minWidth: CARD_MIN_WIDTH,
    padding: Spacing.md,
    borderRadius: CARD_BORDER_RADIUS,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  rowItem: {
    flex: 1,
    minWidth: ROW_ITEM_MIN_WIDTH,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  twoRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  twoRowItem: {
    flex: 1,
    minWidth: CARD_MIN_WIDTH,
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
