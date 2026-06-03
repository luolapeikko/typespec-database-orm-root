import {DecoratorContext, Model, ModelProperty, Scalar, createTypeSpecLibrary, type Type} from "@typespec/compiler";
import {extractSchemaConfig} from "./decorators/schema.js";
import {setIndexFlag} from "./decorators/index.js";
import {
	ORM_IMMUTABLE_STATE,
	ORM_INDEX_STATE,
	ORM_INTERFACE_NAME_STATE,
	ORM_REF_STATE,
	$index as $ormIndex,
	$unique as $ormUnique,
} from "typespec-orm-common";
import {isSchemaTimestampOverride, type SchemaTimestampOverride} from "./emitters/mongoose/timestamp.js";
import {updateObject} from "./decorators/utils.js";

export const $lib = createTypeSpecLibrary({
	name: "typespec-mongoose-emitter",
	diagnostics: {},
	state: {
		schemaRoot: {
			description: "Models explicitly marked as Mongoose schema roots.",
		},
	},
});

export const {reportDiagnostic, createDiagnostic} = $lib;

export const MODEL_ROOT_STATE = Symbol.for("typespec-mongoose-emitter.modelRoot");
export const SCHEMA_ROOT_STATE = Symbol.for("typespec-mongoose-emitter.schemaRoot");
export const SCHEMA_CONFIG_STATE = Symbol.for("typespec-mongoose-emitter.schemaConfig");
export const SCHEMA_TIMESTAMPS_STATE = Symbol.for("typespec-mongoose-emitter.schemaTimestamps");
export const SCALAR_OBJECT_ID_STATE = Symbol.for("typespec-mongoose-emitter.scalarObjectId");
export const SCHEMA_REF_STATE = ORM_REF_STATE;
export const SCHEMA_INDEX_STATE = ORM_INDEX_STATE;
export const SCHEMA_INTERFACE_NAME_STATE = ORM_INTERFACE_NAME_STATE;
export const SCHEMA_IMMUTABLE_STATE = ORM_IMMUTABLE_STATE;

export interface SchemaDecoratorConfig {
	schemaOptionsLiteral?: string;
	schemaOptions?: Record<string, unknown>;
	collection?: string;
}

export function $Model(context: DecoratorContext, target: Model): void {
	context.program.stateSet(MODEL_ROOT_STATE).add(target);
}

export function $Schema(context: DecoratorContext, target: Model, options?: unknown): void {
	context.program.stateSet(SCHEMA_ROOT_STATE).add(target);
	const config = extractSchemaConfig(options);
	if (config) {
		updateObject<SchemaDecoratorConfig>(context.program.stateMap(SCHEMA_CONFIG_STATE), target, config);
	}
}

export function $collection(context: DecoratorContext, target: Model, collectionName: string): void {
	updateObject<SchemaDecoratorConfig>(context.program.stateMap(SCHEMA_CONFIG_STATE), target, {
		collection: collectionName,
	});
}

export function $createdAt(context: DecoratorContext, target: Model, fieldName: string): void {
	updateObject<SchemaTimestampOverride>(context.program.stateMap(SCHEMA_TIMESTAMPS_STATE), target, {
		createdAt: fieldName,
	});
}

export function $updatedAt(context: DecoratorContext, target: Model, fieldName: string): void {
	updateObject<SchemaTimestampOverride>(context.program.stateMap(SCHEMA_TIMESTAMPS_STATE), target, {
		updatedAt: fieldName,
	});
}

export function $ObjectId(context: DecoratorContext, target: Scalar): void {
	context.program.stateSet(SCALAR_OBJECT_ID_STATE).add(target);
}

export function $text(context: DecoratorContext, target: ModelProperty): void {
	setIndexFlag(context, target, "text");
}

export function $sparse(context: DecoratorContext, target: ModelProperty): void {
	setIndexFlag(context, target, "sparse");
}

export function $index(context: DecoratorContext, target: ModelProperty): void {
	$ormIndex(context, target);
}

export function $unique(context: DecoratorContext, target: ModelProperty): void {
	$ormUnique(context, target);
}
