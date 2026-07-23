import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginN from 'eslint-plugin-n';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            'coverage/**',
            '*.min.js',
            '*.bundle.js',
            'vendor/**',
            'public/vendor/**',
            '.next/**',
            'out/**',
            '.cache/**',
            '.parcel-cache/**',
            '.turbo/**',
            'generated/**',
        ],
    },
    pluginJs.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.es2022,
            },
        },
        rules: {
            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'no-console': 'warn',
            'prefer-const': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            curly: ['error', 'all'],
            'no-throw-literal': 'error',
            'no-duplicate-imports': 'error',
            'no-template-curly-in-string': 'error',
            'no-unreachable-loop': 'error',
            'no-useless-assignment': 'error',
            'prefer-promise-reject-errors': 'error',
            'require-await': 'warn',
            'no-empty': ['error', { allowEmptyCatch: false }],
            'no-async-promise-executor': 'error',
            'no-await-in-loop': 'warn',
            'no-promise-executor-return': 'error',
            'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
            'prefer-template': 'error',
            'object-shorthand': ['error', 'always'],
            'no-param-reassign': ['warn', { props: false }],
            'no-return-await': 'error',
            'max-len': [
                'warn',
                {
                    code: 120,
                    ignoreUrls: true,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                },
            ],
            'max-depth': ['warn', 4],
            'max-lines-per-function': [
                'warn',
                { max: 100, skipBlankLines: true, skipComments: true },
            ],
            complexity: ['warn', 15],
        },
    },
    {
        files: ['**/*.test.js', '**/*.spec.js', '**/tests/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
        rules: {
            'no-console': 'off',
            'max-lines-per-function': 'off',
        },
    },
];
