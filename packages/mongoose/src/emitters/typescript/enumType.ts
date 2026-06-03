import type {Enum} from "@typespec/compiler";

/**
 * Emits a TypeScript type definition for a given Enum.
 * @example
 * type Color = "Red" | "Green" | "Blue";
 * @param e The Enum to emit.
 * @returns A string containing the TypeScript type definition.
 */
export function emitTypescriptEnumType(e: Enum): string {
	const members = [...e.members.values()];
	const isNumeric = members.some((m) => typeof m.value === "number");
	const values = members.map((m) => (isNumeric ? String(m.value ?? m.name) : `"${m.value ?? m.name}"`)).join(" | ");
	return `export type ${e.name} = ${values};`;
}
