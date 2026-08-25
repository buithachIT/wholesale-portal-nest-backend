const path = require('node:path');
const webpack = require('webpack');

const prismaGeneratedDir = path.join('generated', 'prisma');

/** @param {import('webpack').Configuration} options */
module.exports = function (options) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      fullySpecified: false,
      extensionAlias: {
        ...options.resolve?.extensionAlias,
        '.js': ['.ts', '.js'],
        '.mjs': ['.ts', '.mjs'],
      },
    },
    plugins: [
      ...(options.plugins ?? []),
      new webpack.NormalModuleReplacementPlugin(/\.js$/, (resource) => {
        const context = resource.context ?? '';
        if (!context.includes(prismaGeneratedDir)) {
          return;
        }
        if (resource.request.startsWith('.') && resource.request.endsWith('.js')) {
          resource.request = resource.request.replace(/\.js$/, '.ts');
        }
      }),
    ],
    module: {
      ...options.module,
      rules: [
        ...(options.module?.rules ?? []),
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
  };
};
