import {type ModelProperty, type Program} from "@typespec/compiler";
import type {IndexDecoratorFlags} from "../../decorators/index.js";
import {resolveType} from "../../resolvers.js";
import {appendIndexFlags, toSingleQuotedLiteral} from "./utils.js";
import {appendStringNumberConstraints} from "./stringNumberDecor.js";
import {enumSchemaFiled} from "./enumField.js";

function normalizeSchemaType(schemaType: string): string {
	if (schemaType === "Schema.Types.ObjectId") {
		return "mongoose.Schema.Types.ObjectId";
	}
	if (schemaType === "[Schema.Types.ObjectId]") {
		return "[mongoose.Schema.Types.ObjectId]";
	}
	return schemaType;
}

export function schemaField(
	program: Program,
	prop: ModelProperty,
	refTarget?: string,
	indexFlags?: IndexDecoratorFlags,
	immutable?: boolean,
): string {
	const required = !prop.optional;

	if (prop.type.kind === "Enum") {
		const {type, parts} = enumSchemaFiled(prop.type, required);
		if (immutable) {
			parts.push("immutable: true");
		}
		appendStringNumberConstraints(parts, type, program, prop);
		appendIndexFlags(parts, indexFlags);
		return `{ ${parts.join(", ")} }`;
	}

	const {schemaType} = resolveType(prop.type, {program});
	const normalizedSchemaType = normalizeSchemaType(schemaType);

	if (refTarget) {
		const refLiteral = toSingleQuotedLiteral(refTarget);
		if (schemaType === "Schema.Types.ObjectId") {
			const parts = ["type: mongoose.Schema.Types.ObjectId", `ref: ${refLiteral}`, `required: ${required}`];
			if (immutable) {
				parts.push("immutable: true");
			}
			appendStringNumberConstraints(parts, schemaType, program, prop);
			appendIndexFlags(parts, indexFlags);
			return `{ ${parts.join(", ")} }`;
		}
		if (schemaType === "[Schema.Types.ObjectId]") {
			const parts = [`type: [mongoose.Schema.Types.ObjectId]`, `ref: ${refLiteral}`, `required: ${required}`];
			if (immutable) {
				parts.push("immutable: true");
			}
			appendStringNumberConstraints(parts, schemaType, program, prop);
			appendIndexFlags(parts, indexFlags);
			return `{ ${parts.join(", ")} }`;
		}
		const parts = [`type: ${normalizedSchemaType}`, `ref: ${refLiteral}`, `required: ${required}`];
		if (immutable) {
			parts.push("immutable: true");
		}
		appendStringNumberConstraints(parts, schemaType, program, prop);
		appendIndexFlags(parts, indexFlags);
		return `{ ${parts.join(", ")} }`;
	}

	const parts = [`type: ${normalizedSchemaType}`, `required: ${required}`];
	if (immutable) {
		parts.push("immutable: true");
	}
	appendStringNumberConstraints(parts, schemaType, program, prop);
	appendIndexFlags(parts, indexFlags);
	return `{ ${parts.join(", ")} }`;
}
