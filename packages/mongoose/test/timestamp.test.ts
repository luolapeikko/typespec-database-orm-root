import {describe, expect, it} from "vitest";
import {isSchemaTimestampOverride} from "../src/emitters/mongoose/timestamp.js";

describe("timestamp", () => {
	describe("isSchemaTimestampOverride", () => {
		it("should return true for valid SchemaTimestampOverride objects", () => {
			expect(isSchemaTimestampOverride({createdAt: "createdAt", updatedAt: "updatedAt"})).toBe(true);
		});

		it("should return false for invalid SchemaTimestampOverride objects", () => {
			expect(isSchemaTimestampOverride({createdAt: 123, updatedAt: "updatedAt"})).toBe(false);
			expect(isSchemaTimestampOverride({createdAt: "createdAt", updatedAt: 123})).toBe(false);
			expect(isSchemaTimestampOverride({createdAt: 123, updatedAt: 123})).toBe(false);
			expect(isSchemaTimestampOverride(null)).toBe(false);
			expect(isSchemaTimestampOverride(undefined)).toBe(false);
		});
	});
});
