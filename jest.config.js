module.exports = {
  name: "web-graph",
  preset: "ts-jest",
  testEnvironment: "jsdom",
  rootDir: "tests",
  moduleNameMapper: {
    "^.+\\.(glsl)$": "<rootDir>/config/glsl.mock.js",
  },
  verbose: true,
};
