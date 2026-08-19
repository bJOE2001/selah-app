const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add 'wasm' and 'db' to asset extensions so Metro can bundle them
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

if (!config.resolver.assetExts.includes('db')) {
  config.resolver.assetExts.push('db');
}

config.resolver.unstable_enablePackageExports = true;

module.exports = config;
