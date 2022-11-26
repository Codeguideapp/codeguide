const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack(config, options) {
    // https://dev.to/swyx/how-to-add-monaco-editor-to-a-next-js-app-ha3
    if (!options.isServer) {
      const specificRules = config.module.rules.find(
        (rule) => rule.oneOf
      ).oneOf;

      const cssRule = specificRules.find(
        (rule) =>
          String(rule.test) === String(/(?<!\.module)\.css$/) &&
          Array.isArray(rule.use)
      );

      specificRules.unshift({
        sideEffects: true,
        test: /[\\/]node_modules[\\/]monaco-editor[\\/].+\.css$/,
        use: cssRule.use,
      });

      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: [
            'json',
            'markdown',
            'css',
            'typescript',
            'javascript',
            'html',
            'graphql',
            'python',
            'scss',
            'yaml',
          ],
          filename: 'static/[name].worker.js',
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
