import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    languageOptions: { globals: globals.node },
    rules: {
      // Express mengenali error handler dari 4 argumennya, jadi `_next` wajib ada walau tidak dipakai
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  prettier,
];
