// metro.config.js

/*
the Uncaught SyntaxError: Cannot use 'import.meta' outside a module is a known, 
recurring issue when using Zustand's middleware (especially devtools)
*/


// Import the default configuration utility from Expo
const { getDefaultConfig } = require('expo/metro-config');

// Get the default configuration
const config = getDefaultConfig(__dirname);

// ADD THIS RESOLVER CONFIGURATION
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;