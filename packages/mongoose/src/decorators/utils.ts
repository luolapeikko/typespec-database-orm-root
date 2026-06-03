import type {Model, ModelProperty, Type} from "@typespec/compiler";

export function updateObject<T extends object>(
	map: Map<Type, any>,
	target: Model | ModelProperty,
	updates: Partial<T>,
): Map<Type, any> {
	return map.set(target, Object.assign({}, map.get(target) ?? {}, updates));
}
