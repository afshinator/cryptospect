import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Shadows } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

const SLIDER_HEIGHT = 8;
const SLIDER_THUMB_SIZE = 20;
const SLIDER_PADDING = 10;

export type SliderProps = {
  value: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  onValueChange: (value: number) => void;
  style?: ViewStyle;
};

export function Slider({
  value,
  minimumValue = 0,
  maximumValue = 1,
  step = 0.1,
  onValueChange,
  style,
}: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackColor = useThemeColor(
    { light: Colors.light.border, dark: Colors.dark.border },
    'border'
  );
  const thumbColor = useThemeColor(
    { light: Colors.light.tint, dark: Colors.dark.tint },
    'tint'
  );
  const filledTrackColor = useThemeColor(
    { light: Colors.light.tint, dark: Colors.dark.tint },
    'tint'
  );

  const percentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;
  const thumbPosition = (trackWidth * percentage) / 100;

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const handlePress = (event: any) => {
    if (trackWidth === 0) return;
    const { locationX } = event.nativeEvent;
    const newPercentage = Math.max(0, Math.min(100, (locationX / trackWidth) * 100));
    const newValue = minimumValue + (newPercentage / 100) * (maximumValue - minimumValue);
    const steppedValue = Math.round(newValue / step) * step;
    onValueChange(Math.max(minimumValue, Math.min(maximumValue, steppedValue)));
  };

  return (
    <Pressable onPress={handlePress} style={[styles.container, style]}>
      <View
        style={[styles.track, { backgroundColor: trackColor }]}
        onLayout={handleLayout}
      >
        <View
          style={[
            styles.filledTrack,
            {
              backgroundColor: filledTrackColor,
              width: thumbPosition + SLIDER_THUMB_SIZE / 2,
            },
          ]}
        />
        <View
          style={[
            styles.thumb,
            Shadows.sm,
            {
              backgroundColor: thumbColor,
              left: Math.max(0, Math.min(trackWidth - SLIDER_THUMB_SIZE, thumbPosition - SLIDER_THUMB_SIZE / 2)),
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SLIDER_PADDING,
  },
  track: {
    height: SLIDER_HEIGHT,
    borderRadius: SLIDER_HEIGHT / 2,
    position: 'relative',
    width: '100%',
  },
  filledTrack: {
    height: SLIDER_HEIGHT,
    borderRadius: SLIDER_HEIGHT / 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    width: SLIDER_THUMB_SIZE,
    height: SLIDER_THUMB_SIZE,
    borderRadius: SLIDER_THUMB_SIZE / 2,
    position: 'absolute',
    top: (SLIDER_HEIGHT - SLIDER_THUMB_SIZE) / 2,
  },
});

