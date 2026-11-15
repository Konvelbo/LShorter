const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customConfig = {
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx)"],
};

module.exports = async () => {
  const baseConfig = await createJestConfig(customConfig)();
  return {
    ...baseConfig,
    transformIgnorePatterns: [
      "[\\\\/]node_modules[\\\\/](?!(\\.pnpm[\\\\/])?(ogl|modern-gif|modern-palette))",
      "^.+\\.module\\.(css|sass|scss)$",
    ],
  };
};
