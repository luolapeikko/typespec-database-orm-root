import type {ArrayValue, BooleanValue, NumericValue, ObjectValue, StringValue, Value} from "@typespec/compiler";
import type {SchemaDecoratorConfig} from "../lib.js";

function isTypeSpecValue(value: unknown): value is Value {
	return (
		typeof value === "object" &&
		value !== null &&
		"valueKind" in value &&
		typeof (value as {valueKind?: unknown}).valueKind === "string"
	);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== "object" || value === null) return false;
	return Object.getPrototypeOf(value) === Object.prototype;
}

function typeEntityToPlain(value: unknown, seen = new Set<unknown>()): unknown {
	if (typeof value !== "object" || value === null) return undefined;
	if (seen.has(value)) return undefined;
	seen.add(value);

	const node = value as Record<string, unknown>;
	if (node.entityKind !== "Type") return undefined;

	switch (node.kind) {
		case "String":
			return typeof node.value === "string" ? node.value : undefined;
		case "Number":
			return typeof node.value === "number" ? node.value : undefined;
		case "Boolean":
			return typeof node.value === "boolean" ? node.value : undefined;
		case "Model": {
			const props = node.properties;
			if (!(props instanceof Map)) return undefined;
			const out: Record<string, unknown> = {};
			for (const [name, prop] of props.entries()) {
				const propType = (prop as {type?: unknown}).type;
				const parsed = typeEntityToPlain(propType, seen);
				if (parsed !== undefined) out[name] = parsed;
			}
			return out;
		}
		default:
			return undefined;
	}
}

function astLiteralToPlain(value: unknown, seen = new Set<unknown>()): unknown {
	if (value === null || value === undefined) return value;
	if (typeof value !== "object") return undefined;
	if (seen.has(value)) return undefined;
	seen.add(value);

	const node = value as Record<string, unknown>;
	switch (node.kind) {
		case "String":
			return typeof node.value === "string" ? node.value : undefined;
		case "Numeric":
			return typeof node.value === "number" ? node.value : undefined;
		case "Boolean":
			return typeof node.value === "boolean" ? node.value : undefined;
		case "Array": {
			if (!Array.isArray(node.values)) return undefined;
			const arr: unknown[] = [];
			for (const item of node.values) {
				const v = astLiteralToPlain(item, seen);
				if (v !== undefined) arr.push(v);
			}
			return arr;
		}
		case "Object": {
			if (!Array.isArray(node.properties)) return undefined;
			const out: Record<string, unknown> = {};
			for (const prop of node.properties) {
				const p = prop as Record<string, unknown>;
				const id = p.id as Record<string, unknown> | undefined;
				const key = typeof id?.sv === "string" ? id.sv : undefined;
				if (!key) continue;
				const parsed = astLiteralToPlain(p.value, seen);
				if (parsed !== undefined) out[key] = parsed;
			}
			return out;
		}
		default:
			return undefined;
	}
}

function quoteKeyIfNeeded(key: string): string {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function valueToLiteral(value: Value): string | undefined {
	switch (value.valueKind) {
		case "StringValue":
			return JSON.stringify((value as StringValue).value);
		case "NumericValue":
			return String((value as NumericValue).value);
		case "BooleanValue":
			return String((value as BooleanValue).value);
		case "NullValue":
			return "null";
		case "ArrayValue": {
			const vals = (value as ArrayValue).values
				.map((x) => valueToLiteral(x))
				.filter((x): x is string => x !== undefined);
			return `[${vals.join(", ")}]`;
		}
		case "ObjectValue":
			return objectValueToLiteral(value as ObjectValue);
		default:
			return undefined;
	}
}

function valueToPlain(value: Value): unknown {
	switch (value.valueKind) {
		case "StringValue":
			return (value as StringValue).value;
		case "NumericValue":
			return (value as NumericValue).value;
		case "BooleanValue":
			return (value as BooleanValue).value;
		case "NullValue":
			return null;
		case "ArrayValue":
			return (value as ArrayValue).values.map((entry) => valueToPlain(entry));
		case "ObjectValue": {
			const out: Record<string, unknown> = {};
			for (const prop of (value as ObjectValue).properties.values()) {
				out[prop.name] = valueToPlain(prop.value);
			}
			return out;
		}
		default:
			return undefined;
	}
}

function plainToLiteral(value: unknown): string | undefined {
	if (value === null) return "null";
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (Array.isArray(value)) {
		const parts = value.map((x) => plainToLiteral(x)).filter((x): x is string => x !== undefined);
		return `[${parts.join(", ")}]`;
	}
	if (isPlainObject(value)) {
		const parts: string[] = [];
		for (const [k, v] of Object.entries(value)) {
			const lit = plainToLiteral(v);
			if (lit === undefined) continue;
			parts.push(`${quoteKeyIfNeeded(k)}: ${lit}`);
		}
		return `{ ${parts.join(", ")} }`;
	}
	return undefined;
}

function objectValueToLiteral(value: ObjectValue, omitKeys = new Set<string>()): string {
	const parts: string[] = [];
	for (const prop of value.properties.values()) {
		if (omitKeys.has(prop.name)) continue;
		const lit = valueToLiteral(prop.value);
		if (lit === undefined) continue;
		parts.push(`${quoteKeyIfNeeded(prop.name)}: ${lit}`);
	}
	return `{ ${parts.join(", ")} }`;
}

export function extractSchemaConfig(options?: unknown): SchemaDecoratorConfig | undefined {
	if (options !== undefined && !isTypeSpecValue(options)) {
		const typeParsed = typeEntityToPlain(options);
		if (isPlainObject(typeParsed)) {
			options = typeParsed;
		}

		const astParsed = astLiteralToPlain(options);
		if (isPlainObject(astParsed)) {
			options = astParsed;
		}

		if (!isPlainObject(options)) {
			return undefined;
		}

		const obj = options as Record<string, unknown>;
		const collection = typeof obj.collection === "string" ? obj.collection : undefined;

		const schemaOnly: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(obj)) {
			if (k === "collection") continue;
			schemaOnly[k] = v;
		}
		const schemaOptionsLiteral = plainToLiteral(schemaOnly);
		const hasSchemaOptions = schemaOptionsLiteral !== "{  }";

		if (!collection && !hasSchemaOptions) return undefined;
		return {
			collection,
			schemaOptions: schemaOnly,
			schemaOptionsLiteral: hasSchemaOptions ? schemaOptionsLiteral : undefined,
		};
	}

	if (!options) return undefined;

	if (options.valueKind !== "ObjectValue") return undefined;

	const objectOptions = options as ObjectValue;
	const collectionProp = objectOptions.properties.get("collection")?.value;
	const collection = collectionProp?.valueKind === "StringValue" ? (collectionProp as StringValue).value : undefined;

	const schemaOptionsLiteral = objectValueToLiteral(objectOptions, new Set(["collection"]));
	const hasSchemaOptions = schemaOptionsLiteral !== "{  }";

	if (!collection && !hasSchemaOptions) return undefined;

	return {
		collection,
		schemaOptions: valueToPlain(objectOptions) as Record<string, unknown> | undefined,
		schemaOptionsLiteral: hasSchemaOptions ? schemaOptionsLiteral : undefined,
	};
}
