import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        hookTimeout: 120000,
        coverage: {
            reporter: ["text", "lcov"],
            include: ["src/**/*.ts"],
            exclude: ["src/__tests__/**", "src/index.ts"]
        },
        testTimeout: 120000
    }
});
