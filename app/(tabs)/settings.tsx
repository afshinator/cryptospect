import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SupportedCurrency } from '@/constants/currency';
import { usePrefsStore } from '@/stores/prefsStore';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const {
    lightDarkMode,
    fontScale,
    currency,
    compactMode,
    setLightDarkMode,
    setFontScale,
    setCurrency,
    setCompactMode,
  } = usePrefsStore();

  const commonCurrencies: SupportedCurrency[] = ['usd', 'eur', 'gbp', 'jpy', 'cny', 'cad', 'aud'];

  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Settings
        </ThemedText>

        {/* Light/Dark Mode */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Theme Mode
          </ThemedText>
          <View style={styles.buttonRow}>
            {(['system', 'light', 'dark'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.button,
                  lightDarkMode === mode && styles.buttonActive,
                ]}
                onPress={() => setLightDarkMode(mode)}
              >
                <ThemedText
                  type="defaultSemiBold"
                  colorVariant={lightDarkMode === mode ? 'text' : 'textSubtle'}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* Font Scale */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Font Scale: {fontScale.toFixed(1)}x
          </ThemedText>
          <View style={styles.buttonRow}>
            {[0.75, 0.875, 1.0, 1.125, 1.25, 1.5].map((scale) => (
              <TouchableOpacity
                key={scale}
                style={[
                  styles.button,
                  Math.abs(fontScale - scale) < 0.01 && styles.buttonActive,
                ]}
                onPress={() => setFontScale(scale)}
              >
                <ThemedText
                  type="defaultSemiBold"
                  colorVariant={Math.abs(fontScale - scale) < 0.01 ? 'text' : 'textSubtle'}
                >
                  {scale}x
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* Currency */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Currency
          </ThemedText>
          <View style={styles.buttonRow}>
            {commonCurrencies.map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.button,
                  currency === curr && styles.buttonActive,
                ]}
                onPress={() => setCurrency(curr)}
              >
                <ThemedText
                  type="defaultSemiBold"
                  colorVariant={currency === curr ? 'text' : 'textSubtle'}
                >
                  {curr.toUpperCase()}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* Compact Mode */}
        <ThemedView style={styles.section}>
          <View style={styles.switchRow}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Compact Mode
            </ThemedText>
            <Switch
              value={compactMode}
              onValueChange={setCompactMode}
              trackColor={{ false: '#767577', true: '#0a7ea4' }}
              thumbColor={compactMode ? '#fff' : '#f4f3f4'}
            />
          </View>
          <ThemedText type="small" colorVariant="textSubtle">
            Reduce spacing and padding for a more compact layout
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minWidth: 60,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderColor: '#0a7ea4',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});
