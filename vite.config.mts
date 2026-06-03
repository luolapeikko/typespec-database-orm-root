import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		reporters: ["github-actions", "verbose"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			reporter: ["text"],
		},
		include: ["**/*.test.ts"],
		typecheck: {
			include: ["**/*.test-d.ts"],
		},
	},
});
