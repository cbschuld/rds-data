module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  extends: ['plugin:@typescript-eslint/recommended', 'airbnb', 'prettier'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      modules: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['prettier', '@typescript-eslint'],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {},
    },
  },
  rules: {
    'import/no-extraneous-dependencies': [2, { devDependencies: ['**/test.tsx', '**/test.ts'] }],
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'jsx-a11y/label-has-associated-control': [
      2,
      {
        labelComponents: [],
        labelAttributes: ['label'],
        controlComponents: ['Input'],
        depth: 3,
      },
    ],
  },
};
