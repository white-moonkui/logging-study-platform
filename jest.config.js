/**
 * Jest 测试配置
 */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    testPathIgnorePatterns: ['.devtoolkit/snapshots/'],
    verbose: true,
    testTimeout: 30000,
    forceExit: true,
    detectOpenHandles: true,
    maxWorkers: 1,
};
