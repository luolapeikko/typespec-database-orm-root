import type {IndexDecoratorFlags} from "../../decorators/index.js";

export function toSingleQuotedLiteral(value: string): string {
	return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

export function appendIndexFlags(parts: string[], flags?: IndexDecoratorFlags): void {
	if (!flags) return;
	if (flags.unique) parts.push("unique: true");
	if (flags.text) parts.push("text: true");
	if (flags.index) parts.push("index: true");
	if (flags.sparse) parts.push("sparse: true");
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
