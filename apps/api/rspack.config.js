const path = require('path');
const nodeExternals = require('webpack-node-externals');

/**
 * NestJS Rspack config for yarn workspaces monorepo.
 * Hoisted root node_modules must be externalized too.
 */
module.exports = (options) => {
  const lazyImports = [
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets',
    '@nestjs/websockets/socket-module',
    '@nestjs/platform-socket.io',
    'class-transformer/storage',
  ];

  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        ...(options.resolve?.alias || {}),
        '@': path.resolve(__dirname, 'src'),
      },
    },
    externals: [
      nodeExternals({
        // Workspace TS packages must be bundled — Node strip-only can't run enums.
        allowlist: [/^@hydrorage\//],
        additionalModuleDirs: [
          path.join(__dirname, '../../node_modules'),
          path.join(__dirname, 'node_modules'),
        ],
      }),
      ({ request }, callback) => {
        if (!request) return callback();
        if (
          lazyImports.some(
            (pkg) => request === pkg || request.startsWith(`${pkg}/`),
          )
        ) {
          return callback(null, `commonjs ${request}`);
        }
        return callback();
      },
    ],
  };
};
