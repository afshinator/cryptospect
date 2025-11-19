/**
 * Hook to detect if text content will wrap in a horizontal layout
 * Useful for responsive layouts that need to switch between single-row and multi-row displays
 * 
 * @param enabled - Whether wrapping detection is enabled
 * @param expectedSingleRowHeight - Expected height when items fit on one row (default: 80px)
 * @param dependencies - Additional dependencies that should trigger re-measurement (e.g., font scale, data)
 * @returns Object with { useTwoRows, hasMeasured, handleLayout }
 */

import { usePreferences } from "@/hooks/use-preference";
import React, { useState, useEffect } from "react";
import { LayoutChangeEvent } from "react-native";

interface UseTextWrappingDetectionOptions {
  enabled?: boolean;
  expectedSingleRowHeight?: number;
  dependencies?: React.DependencyList;
}

export function useTextWrappingDetection({
  enabled = true,
  expectedSingleRowHeight = 80,
  dependencies = [],
}: UseTextWrappingDetectionOptions = {}) {
  const { data: preferences } = usePreferences();
  const fontScale = preferences?.fontScale ?? 1.0;
  
  const [useTwoRows, setUseTwoRows] = useState(false);
  const [hasMeasured, setHasMeasured] = useState(false);

  // Reset measurement when font scale changes or other dependencies change
  // Note: We spread dependencies into the dependency array, which is intentional
  // to allow callers to pass dynamic dependencies
  useEffect(() => {
    if (enabled) {
      setHasMeasured(false);
      setUseTwoRows(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fontScale, ...dependencies]);

  const handleLayout = (event: LayoutChangeEvent) => {
    if (!hasMeasured && enabled) {
      const height = event.nativeEvent.layout.height;
      // If actual height is significantly more than expected, items have wrapped
      setUseTwoRows(height > expectedSingleRowHeight);
      setHasMeasured(true);
    }
  };

  return {
    useTwoRows,
    hasMeasured,
    handleLayout,
  };
}

