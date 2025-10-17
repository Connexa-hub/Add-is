const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons']
    }
  }, argv);

  if (config.devServer) {
    config.devServer.host = '0.0.0.0';
    config.devServer.port = 5000;
    config.devServer.allowedHosts = 'all';
  }

  // Add Node.js polyfills for browser
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    process: require.resolve('process/browser'),
    vm: require.resolve('vm-browserify'),
    buffer: require.resolve('buffer/')
  };

  return config;
};
