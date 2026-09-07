module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 ships its worklets transform here; must be the last plugin.
    plugins: ['react-native-worklets/plugin'],
  };
};
