module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: 'standard-with-typescript',
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      rules: {
        '@typescript-eslint/comma-dangle': 'off',
        '@typescript-eslint/strict-boolean-expressions': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/consistent-type-assertions': 'off',
        '@typescript-eslint/prefer-reduce-type-parameter': 'warn',
        '@typescript-eslint/restrict-template-expressions': ['warn', { allowNumber: true }]
      }
    }
  ],
  rules: {
    semi: ['error', 'never'],
    'comma-dangle': 'off',
    'multiline-ternary': 'off'
  }
}
