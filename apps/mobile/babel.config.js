module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      function transformNodeImports(babel) {
        const { types: t } = babel;
        return {
          visitor: {
            ImportDeclaration(path) {
              const source = path.node.source.value;
              if (source.startsWith('node:')) {
                // Replace node:buffer with buffer, node:crypto with crypto, etc.
                const newSource = source.replace('node:', '');
                path.node.source = t.stringLiteral(newSource);
              }
            },
          },
        };
      },
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '~': './',
          },
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
