import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-links",
    "@storybook/addon-themes"
  ],
  "framework": "@storybook/react-vite",
  "docs": {
    "autodocs": true
  }
};
export default config;