import { Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { CurrencyBanner } from "@/components/CurrencyBanner";
import { CoinListItem } from "@/components/CoinListItem";
import { DominanceSection } from "@/components/DominanceSection";
import { HelloWave } from "@/components/hello-wave";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useCoinLists } from "@/hooks/use-coin-lists";

export default function HomeScreen() {
  const router = useRouter();
  const { data: lists, isLoading } = useCoinLists();

  const handleListPress = (listId: string) => {
    router.push(`/list-detail?id=${listId}`);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}> 
      
      {/* FIXED CONTENT: Currency Banner remains at the top */}
      <CurrencyBanner lessText />

      {/* SCROLLABLE CONTENT */}
      <ScrollView 
        style={styles.scrollArea}
        contentContainerStyle={styles.contentContainer}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="large">CryptoSpect</ThemedText>
          <HelloWave />
        </ThemedView>

        {/* Dominance Section */}
        <DominanceSection showAllFour={true}/>

        {/* Coin Lists Section */}
        <ThemedView style={styles.listsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Coin Lists
          </ThemedText>
          {isLoading ? (
            <ThemedText type="body" variant="secondary">
              Loading lists...
            </ThemedText>
          ) : lists && lists.length > 0 ? (
            lists.map((list) => (
              <CoinListItem
                key={list.id}
                list={list}
                onPress={handleListPress}
                showChevron={true}
                variant="home"
              />
            ))
          ) : (
            <ThemedText type="body" variant="secondary">
              No lists yet. Create your first list in the Lists tab!
            </ThemedText>
          )}
        </ThemedView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  contentContainer: {
    paddingVertical: Spacing.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  listsSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  stepContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});