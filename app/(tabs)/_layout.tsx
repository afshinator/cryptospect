import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dominance"
        options={{
          title: "Dominance",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="chart.line.uptrend.xyaxis"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: "Lists",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="rates"
        options={{
          title: "rates",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="dollarsign.arrow.circlepath"
              color={color}
            />
          ),
        }}
      />


      {/* <Tabs.Screen
        name="example"
        options={{
          title: "example",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="ellipsis.circle.fill" color={color} />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
