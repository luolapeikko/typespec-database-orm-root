import type {Enum} from "@typespec/compiler";

export function enumSchemaFiled(e: Enum, required: boolean): {type: "String" | "Number"; parts: string[]} {
	const members = [...e.members.values()];
	const isNumeric = members.some((m) => typeof m.value === "number");
	const base = isNumeric ? "Number" : "String";
	const vals = members.map((m) => (isNumeric ? (m.value ?? m.name) : `"${m.value ?? m.name}"`)).join(", ");
	return {
		type: base,
		parts: [`type: ${base}`, `enum: [${vals}]`, `required: ${required}`],
	};
}
