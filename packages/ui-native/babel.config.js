// Used by jest (jest-expo). The example app has its own babel.config.js.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo"], "nativewind/babel"],
  };
};
