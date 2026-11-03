const { createRequire } = require("node:module");
const { createTransformer } = require("react-native-svg-transformer");

// Resolve from Expo itself: npm may install @expo/metro-config inside Expo.
// Importing expo/node_modules/... is blocked by Expo's package exports.
const requireFromExpo = createRequire(require.resolve("expo/metro-config"));
const expoTransformer = requireFromExpo("@expo/metro-config/babel-transformer");

module.exports.transform = createTransformer(expoTransformer);
