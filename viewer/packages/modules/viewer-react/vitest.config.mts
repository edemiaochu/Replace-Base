import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'esnext',
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/vitest.setup.ts",
    globals: true,
    include: ["src/tests/**/*.test.{ts,tsx}"],
    // Added to ensure these modules are processed correctly by Vitest, as they export non-JavaScript formats (e.g., .scss) 
    // that Node.js does not understand natively.
    server: {
      deps: {
        inline: ["@szewtwin/appui-react", "@szewtwin/ivault-components-react", "@szewtwin/components-react", "@szewtwin/core-react",
          "@szewtwin/presentation-components"
        ]
      }
    },
    minWorkers: 1,
    maxWorkers: 3
  },
});