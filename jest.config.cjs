/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "@swc/jest",
  },
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
};
