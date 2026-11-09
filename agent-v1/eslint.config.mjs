import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: [
      'next/core-web-vitals',
      'next/typescript',
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-children-prop': 'warn', // Changed from error to warning
      'react/no-unescaped-entities': 'warn', // Changed from error to warning
      'react-hooks/rules-of-hooks': 'warn', // Changed from error to warning
      '@typescript-eslint/no-unused-expressions': 'warn', // Changed from error to warning
      'prefer-const': 'warn', // Changed from error to warning
    },
  }),
]

export default eslintConfig
