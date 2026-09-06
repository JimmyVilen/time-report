import eslint from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

const tsconfigRootDir = import.meta.dirname

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'eslint.config.js',
      'src/routeTree.gen.ts',
      'serve.js',
    ],
  },

  // Server, tests and scripts keep the strict type-checked rule set they were
  // written against as a standalone backend. They must be type-resolved against
  // tsconfig.server.json: several null-guards here are only meaningful under
  // `noUncheckedIndexedAccess`, which the app project does not enable.
  {
    files: ['src/server/**/*.ts', 'test/**/*.ts', 'scripts/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
    ],
    languageOptions: {
      parserOptions: { project: ['./tsconfig.server.json'], tsconfigRootDir },
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },

  // Application code keeps the rule set it was written against.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/server/**'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { project: ['./tsconfig.json'], tsconfigRootDir },
    },
  },

  {
    files: ['*.config.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: { project: ['./tsconfig.server.json'], tsconfigRootDir },
    },
  },
)
