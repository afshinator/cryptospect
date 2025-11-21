// app.config.js
// This file replaces app.json and allows us to use environment variables

export default {
  expo: {
    name: "cryptospect",
    slug: "cryptospect",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "cryptospect",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.cryptospect",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.cryptospect",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      // Expose environment variables to the app via Constants.expoConfig.extra
      backendApiKey: process.env.EXPO_PUBLIC_BACKEND_API_KEY || process.env.BACKEND_API_KEY,
      backendBaseUrl: process.env.EXPO_PUBLIC_BACKEND_BASE_URL || process.env.BACKEND_BASE_URL,
    },
  },
};

