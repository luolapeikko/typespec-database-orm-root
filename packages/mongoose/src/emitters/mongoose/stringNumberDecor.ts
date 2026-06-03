import {
	type ModelProperty,
	type Program,
	type Value,
	getMaxLength,
	getMaxValue,
	getMinLength,
	getMinValue,
	getPattern,
} from "@typespec/compiler";

function serializeDefaultValue(value: Value): string | undefined {
	switch (value.valueKind) {
		case "StringValue":
			return JSON.stringify(value.value);
		case "BooleanValue":
			return value.value ? "true" : "false";
		case "NumericValue":
			return String(value.value);
		case "NullValue":
			return "null";
		case "EnumValue":
			return JSON.stringify(value.value.value ?? value.value.name);
		case "ArrayValue": {
			const items = value.values.map(serializeDefaultValue);
			if (items.some((x) => x === undefined)) return undefined;
			return `[${items.join(", ")}]`;
		}
		case "ObjectValue": {
			const entries: string[] = [];
			for (const prop of value.properties.values()) {
				const serialized = serializeDefaultValue(prop.value);
				if (serialized === undefined) return undefined;
				entries.push(`${JSON.stringify(prop.name)}: ${serialized}`);
			}
			return `{ ${entries.join(", ")} }`;
		}
		default:
			return undefined;
	}
}

export const appendStringNumberConstraints = (
	parts: string[],
	schemaType: string,
	program: Program,
	prop: ModelProperty,
) => {
	if (prop.defaultValue) {
		const defaultValue = serializeDefaultValue(prop.defaultValue);
		if (defaultValue !== undefined) {
			parts.push(`default: ${defaultValue}`);
		}
	}

	if (schemaType === "String") {
		const minLength = getMinLength(program, prop);
		const maxLength = getMaxLength(program, prop);
		const pattern = getPattern(program, prop);
		if (typeof minLength === "number") parts.push(`minlength: ${minLength}`);
		if (typeof maxLength === "number") parts.push(`maxlength: ${maxLength}`);
		if (typeof pattern === "string") {
			parts.push(`validate: { validator: (v: string) => new RegExp(${JSON.stringify(pattern)}).test(v) }`);
		}
	}
	if (schemaType === "Number") {
		const minValue = getMinValue(program, prop);
		const maxValue = getMaxValue(program, prop);
		if (typeof minValue === "number") parts.push(`min: ${minValue}`);
		if (typeof maxValue === "number") parts.push(`max: ${maxValue}`);
	}
};
