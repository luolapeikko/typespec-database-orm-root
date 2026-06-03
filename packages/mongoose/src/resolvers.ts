import {type Enum, type Model, type Program, type Scalar, type Type, type Union} from "@typespec/compiler";
import {MODEL_ROOT_STATE, SCALAR_OBJECT_ID_STATE, SCHEMA_ROOT_STATE} from "./lib.js";

export interface ResolveTypeOptions {
	getInterfaceName?: (model: Model) => string;
	program?: Program;
}

export function resolveScalar(
	scalar: Scalar,
	options?: ResolveTypeOptions,
): {
	schemaType: string;
	tsType: string;
} {
	let current: Scalar | undefined = scalar;
	const objectIdScalars = options?.program?.stateSet(SCALAR_OBJECT_ID_STATE);
	while (current) {
		if (objectIdScalars?.has(current)) {
			return {
				schemaType: "Schema.Types.ObjectId",
				tsType: "mongoose.Types.ObjectId",
			};
		}

		switch (current.name) {
			case "string":
			case "url":
				return {schemaType: "String", tsType: "string"};
			case "int8":
			case "int16":
			case "int32":
			case "int64":
			case "uint8":
			case "uint16":
			case "uint32":
			case "uint64":
			case "integer":
			case "safeint":
			case "float32":
			case "float64":
			case "decimal":
			case "decimal128":
			case "numeric":
				return {schemaType: "Number", tsType: "number"};
			case "boolean":
				return {schemaType: "Boolean", tsType: "boolean"};
			case "plainDate":
			case "utcDateTime":
			case "offsetDateTime":
			case "plainTime":
				return {schemaType: "Date", tsType: "Date"};
			case "bytes":
				return {schemaType: "Buffer", tsType: "Buffer"};
		}
		current = current.baseScalar;
	}
	return {schemaType: "Schema.Types.Mixed", tsType: "unknown"};
}

export function resolveUnion(u: Union, options?: ResolveTypeOptions) {
	const variants = [...u.variants.values()];
	const isNull = (t: Type) => t.kind === "Intrinsic" && t.name === "null";
	const nonNull = variants.filter((v) => !isNull(v.type));
	const hasNull = variants.some((v) => isNull(v.type));
	if (nonNull.length === 1) {
		const base = resolveType(nonNull[0].type, options);
		return {
			schemaType: base.schemaType,
			tsType: hasNull ? `${base.tsType} | null` : base.tsType,
		};
	}
	return {
		schemaType: "Schema.Types.Mixed",
		tsType: variants.map((v) => resolveType(v.type, options).tsType).join(" | "),
	};
}

function resolveEnum(e: Enum): {schemaType: string; tsType: string} {
	const members = [...e.members.values()];
	const type = members.some((m) => typeof m.value === "number") ? "Number" : "String";
	return {schemaType: type, tsType: e.name};
}

export function resolveType(type: Type, options?: ResolveTypeOptions): {schemaType: string; tsType: string} {
	switch (type.kind) {
		case "Scalar":
			return resolveScalar(type, options);

		case "Model": {
			const m = type as Model;
			// Array<T>: indexer with integer key
			if (m.indexer && m.indexer.key.name === "integer") {
				const el = resolveType(m.indexer.value, options);
				return {schemaType: `[${el.schemaType}]`, tsType: `${el.tsType}[]`};
			}
			if (m.name) {
				const interfaceName = options?.getInterfaceName ? options.getInterfaceName(m) : `I${m.name}`;
				const shouldEmitSchema =
					options?.program?.stateSet(MODEL_ROOT_STATE).has(m) || options?.program?.stateSet(SCHEMA_ROOT_STATE).has(m);
				return {schemaType: shouldEmitSchema ? `${m.name}Schema` : "Object", tsType: interfaceName};
			}
			return {schemaType: "Schema.Types.Mixed", tsType: "Record<string, unknown>"};
		}

		case "Enum": {
			return resolveEnum(type);
		}

		case "Union": {
			return resolveUnion(type, options);
		}

		case "Intrinsic":
			if (type.name === "null") return {schemaType: "null", tsType: "null"};
			return {schemaType: "Schema.Types.Mixed", tsType: "unknown"};

		default:
			return {schemaType: "Schema.Types.Mixed", tsType: "unknown"};
	}
}
