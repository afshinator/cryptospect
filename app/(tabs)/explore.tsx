import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing } from '@/constants/theme';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="large">
          Explore
        </ThemedText>
      </ThemedView>
      
      <ThemedText>
        This app includes example code to help you get started.
      </ThemedText>
      
      <Collapsible title="File-based routing">
        <ThemedText>
          This app has two screens:{' '}
          <ThemedText type="bodySemibold">app/(tabs)/index.tsx</ThemedText> and{' '}
          <ThemedText type="bodySemibold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          The layout file in <ThemedText type="bodySemibold">app/(tabs)/_layout.tsx</ThemedText>{' '}
          sets up the tab navigator.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText variant="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      
      <Collapsible title="Android, iOS, and web support">
        <ThemedText>
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <ThemedText type="bodySemibold">w</ThemedText> in the terminal running this project.
        </ThemedText>
      </Collapsible>
      
      <Collapsible title="Images">
        <ThemedText>
          For static images, you can use the <ThemedText type="bodySemibold">@2x</ThemedText> and{' '}
          <ThemedText type="bodySemibold">@3x</ThemedText> suffixes to provide files for
          different screen densities
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={styles.reactLogo}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText variant="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      
      <Collapsible title="Light and dark mode components">
        <ThemedText>
          This template has light and dark mode support. The{' '}
          <ThemedText type="bodySemibold">useColorScheme()</ThemedText> hook lets you inspect
          what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText variant="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      
      <Collapsible title="Animations">
        <ThemedText>
          This template includes an example of an animated component. The{' '}
          <ThemedText type="bodySemibold">components/HelloWave.tsx</ThemedText> component uses
          the powerful{' '}
          <ThemedText type="bodySemibold">react-native-reanimated</ThemedText>{' '}
          library to create a waving hand animation.
        </ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  reactLogo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
});