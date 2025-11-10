module.exports = {
  roots: ["<rootDir>/src"],
  testEnvironment: "jsdom",
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    // Map vitest import to Jest globals so Vitest-style tests run under Jest
    "^vitest$": "@jest/globals",
    // Stub out any imported style / asset files
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },
};