import {isPlainObject} from "./utils.js";

export interface SchemaTimestampOverride {
	createdAt?: string;
	updatedAt?: string;
}

export function isSchemaTimestampOverride(value: unknown): value is SchemaTimestampOverride {
	return (
		isPlainObject(value) &&
		(value.createdAt === undefined || typeof value.createdAt === "string") &&
		(value.updatedAt === undefined || typeof value.updatedAt === "string")
	);
}
