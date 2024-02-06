module.exports = {
  moduleFileExtensions: ['js'],
  testRegex: '/tests/.*\\.spec.(js)$',
  collectCoverageFrom: ['modules/**.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
