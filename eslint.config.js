import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'src-tauri/**',
      'node_modules/**',
      'tests/**',
      '*.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-control-regex': 'off',
      'prefer-const': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/pro/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/pro/**',
                '**/pro',
                '../pro/**',
                '../pro',
                './pro/**',
                './pro',
                '@/pro/**',
                '@/pro',
              ],
              message: 'Direct imports from src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "ImportExpression[source.value=/(^|\\/|@)pro(\\/|$)/]",
          message: 'Dynamic imports targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "ImportExpression > TemplateLiteral[quasis.0.value.raw=/(^|\\/|@)pro(\\/|$)/]",
          message: 'Dynamic imports targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "CallExpression[callee.name='require'][arguments.0.value=/(^|\\/|@)pro(\\/|$)/]",
          message: 'require calls targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "CallExpression[callee.name='require'] > TemplateLiteral[quasis.0.value.raw=/(^|\\/|@)pro(\\/|$)/]",
          message: 'require calls targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "CallExpression[callee.object.type='MetaProperty'][callee.property.name=/^glob/] Literal[value=/(^|\\/|@)pro(\\/|$)/]",
          message: 'Vite glob imports targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "CallExpression[callee.object.type='MetaProperty'][callee.property.name=/^glob/] TemplateElement[value.raw=/(^|\\/|@)pro(\\/|$)/]",
          message: 'Vite glob imports targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/main.tsx', 'src/pro/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/pro/**',
                '**/pro',
                '../pro/**',
                '../pro',
                './pro/**',
                './pro',
                '@/pro/**',
                '@/pro',
              ],
              message: 'Direct imports from src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
            },
            {
              group: ['@pro-entry'],
              message: '@pro-entry can only be imported in src/main.tsx.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "ImportExpression[source.value=/(^|\\/|@)pro(\\/|$)/]",
          message: 'Dynamic imports targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "ImportExpression > TemplateLiteral[quasis.0.value.raw=/(^|\\/|@)pro(\\/|$)/]",
          message: 'Dynamic imports targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "CallExpression[callee.name='require'][arguments.0.value=/(^|\\/|@)pro(\\/|$)/]",
          message: 'require calls targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "CallExpression[callee.name='require'] > TemplateLiteral[quasis.0.value.raw=/(^|\\/|@)pro(\\/|$)/]",
          message: 'require calls targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "CallExpression[callee.object.type='MetaProperty'][callee.property.name=/^glob/] Literal[value=/(^|\\/|@)pro(\\/|$)/]",
          message: 'Vite glob imports targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "CallExpression[callee.object.type='MetaProperty'][callee.property.name=/^glob/] TemplateElement[value.raw=/(^|\\/|@)pro(\\/|$)/]",
          message: 'Vite glob imports targeting src/pro/ are forbidden outside src/pro/. Use src/pro-api/ instead.',
        },
        {
          selector: "ImportExpression[source.value='@pro-entry']",
          message: 'Dynamic imports targeting @pro-entry can only be in src/main.tsx.',
        },
        {
          selector: "CallExpression[callee.name='require'][arguments.0.value='@pro-entry']",
          message: 'require calls targeting @pro-entry are forbidden outside src/main.tsx.',
        },
      ],
    },
  }
);
