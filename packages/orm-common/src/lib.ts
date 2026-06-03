import {DecoratorContext, Model, ModelProperty, createTypeSpecLibrary, type Type} from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
	name: "typespec-orm-common",
	diagnostics: {},
});

export const ORM_INDEX_STATE = Symbol.for("typespec-orm-common.schemaIndex");
export const ORM_INTERFACE_NAME_STATE = Symbol.for("typespec-orm-common.interfaceName");
export const ORM_REF_STATE = Symbol.for("typespec-orm-common.ref");
export const ORM_IMMUTABLE_STATE = Symbol.for("typespec-orm-common.immutable");

export interface OrmIndexDecoratorFlags {
	unique?: boolean;
	index?: boolean;
}

function updateObject<T extends object>(
	map: Map<Type, any>,
	target: ModelProperty,
	updates: Partial<T>,
): Map<Type, any> {
	return map.set(target, Object.assign({}, map.get(target) ?? {}, updates));
}

export function $unique(context: DecoratorContext, target: ModelProperty): void {
	updateObject(context.program.stateMap(ORM_INDEX_STATE), target, {unique: true});
}

export function $index(context: DecoratorContext, target: ModelProperty): void {
	updateObject(context.program.stateMap(ORM_INDEX_STATE), target, {index: true});
}

export function $interfaceName(context: DecoratorContext, target: Model, name: string): void {
	context.program.stateMap(ORM_INTERFACE_NAME_STATE).set(target, name);
}

export function $ref(context: DecoratorContext, target: ModelProperty, modelName: string): void {
	context.program.stateMap(ORM_REF_STATE).set(target, modelName);
}

export function $immutable(context: DecoratorContext, target: ModelProperty): void {
	context.program.stateSet(ORM_IMMUTABLE_STATE).add(target);
}
