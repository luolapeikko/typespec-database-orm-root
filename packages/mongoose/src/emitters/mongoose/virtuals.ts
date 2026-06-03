import type {SchemaDecoratorConfig} from "../../lib.js";
import type {SchemaTimestampOverride} from "./timestamp.js";

export type MongooseVirtuals = Map<string, "string" | "Date">;

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

function resolveTimestampFieldName(value: unknown, defaultName?: string): string | undefined {
	if (value === false) return undefined;
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed ? trimmed : defaultName;
	}
	return defaultName;
}

function plainToLiteral(value: unknown): string | undefined {
	if (value === null) return "null";
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (Array.isArray(value)) {
		const parts = value.map((item) => plainToLiteral(item)).filter((item): item is string => item !== undefined);
		return `[${parts.join(", ")}]`;
	}
	if (isPlainObject(value)) {
		const parts = Object.entries(value)
			.map(([key, item]) => {
				const literal = plainToLiteral(item);
				if (literal === undefined) return undefined;
				return `${key}: ${literal}`;
			})
			.filter((item): item is string => item !== undefined);
		return `{ ${parts.join(", ")} }`;
	}
	return undefined;
}

function resolveTimestampNames(
	timestamps: unknown,
	timestampOverride?: SchemaTimestampOverride,
): {createdAtName?: string; updatedAtName?: string} {
	let createdAtName: string | undefined;
	let updatedAtName: string | undefined;
	if (timestamps === true) {
		createdAtName = "createdAt";
		updatedAtName = "updatedAt";
	} else if (isPlainObject(timestamps)) {
		createdAtName = resolveTimestampFieldName(timestamps.createdAt);
		updatedAtName = resolveTimestampFieldName(timestamps.updatedAt);
	}
	if (timestampOverride?.createdAt) {
		createdAtName = timestampOverride.createdAt;
	}
	if (timestampOverride?.updatedAt) {
		updatedAtName = timestampOverride.updatedAt;
	}
	return {createdAtName, updatedAtName};
}

function resolveTimestampOption(
	config?: SchemaDecoratorConfig,
	timestampOverride?: SchemaTimestampOverride,
): true | Record<string, unknown> | undefined {
	const timestamps = config?.schemaOptions?.timestamps;
	if (
		timestamps !== true &&
		!isPlainObject(timestamps) &&
		!timestampOverride?.createdAt &&
		!timestampOverride?.updatedAt
	) {
		return undefined;
	}

	if (!timestampOverride?.createdAt && !timestampOverride?.updatedAt) {
		if (timestamps === true) {
			return true;
		}
		if (isPlainObject(timestamps)) {
			return {...timestamps};
		}
	}

	const resolved: Record<string, unknown> = isPlainObject(timestamps) ? {...timestamps} : {};
	const {createdAtName, updatedAtName} = resolveTimestampNames(timestamps, timestampOverride);
	if (createdAtName) {
		resolved.createdAt = createdAtName;
	} else {
		delete resolved.createdAt;
	}
	if (updatedAtName) {
		resolved.updatedAt = updatedAtName;
	} else {
		delete resolved.updatedAt;
	}

	return resolved;
}

export function buildSchemaOptionsLiteral(
	config?: SchemaDecoratorConfig,
	timestampOverride?: SchemaTimestampOverride,
): string | undefined {
	const schemaOptions = isPlainObject(config?.schemaOptions) ? {...config.schemaOptions} : {};
	const timestamps = resolveTimestampOption(config, timestampOverride);

	if (timestamps !== undefined) {
		schemaOptions.timestamps = timestamps;
	}

	if (Object.keys(schemaOptions).length === 0) {
		return undefined;
	}

	return plainToLiteral(schemaOptions);
}

export function resolveVirtualFields(
	config?: SchemaDecoratorConfig,
	timestampOverride?: SchemaTimestampOverride,
): MongooseVirtuals {
	const schemaId = config?.schemaOptions?.id;
	const hasIdVirtual = schemaId === true;
	const {createdAtName, updatedAtName} = resolveTimestampNames(config?.schemaOptions?.timestamps, timestampOverride);

	const fields: MongooseVirtuals = new Map();
	if (hasIdVirtual) {
		fields.set("id", "string");
	}
	if (createdAtName || updatedAtName) {
		fields.set(createdAtName ?? "createdAt", "Date");
		fields.set(updatedAtName ?? "updatedAt", "Date");
	}
	return fields;
}

/**
 * Emits a TypeScript type definition for Mongoose virtual fields based on the provided configuration and timestamp overrides.
 * @example
 * type UserVirtuals = {
 *   id: string;
 *   createdAt: Date;
 *   updatedAt: Date;
 * }
 * @param typeName The name of the TypeScript type to emit.
 * @param fields The virtual fields to include in the type.
 * @returns A string containing the TypeScript type definition for the virtual fields.
 */
export function emitMongooseVirtualsType(typeName: string, fields: MongooseVirtuals): string {
	if (fields.size === 0) {
		return `type ${typeName} = {};`;
	}
	const values = Array.from(fields.entries()).map(([name, type]) => `\treadonly ${name}: ${type};\n`);
	return `type ${typeName} = {\n${values.join("")}};`;
}
