import type {Model, Program} from "@typespec/compiler";
import {resolveType} from "../../resolvers.js";

/**
 * Emits a TypeScript interface definition for a given Model.
 * @example
 * export interface IUser {
 *   name: string;
 *   age?: number;
 * }
 * @param model The Model to emit as a TypeScript interface.
 * @param program The TypeSpec program, used for type resolution.
 * @param getInterfaceName Optional function to determine the interface name for a given model. (default: `I${model.name}`)
 * @returns A string containing the TypeScript interface definition.
 */
export function emitTypecriptInterface(
	model: Model,
	program: Program,
	getInterfaceName?: (model: Model) => string,
): string {
	const interfaceName = getInterfaceName ? getInterfaceName(model) : `I${model.name}`;
	const base = model.baseModel
		? ` extends ${getInterfaceName ? getInterfaceName(model.baseModel) : `I${model.baseModel.name}`}`
		: "";
	const lines = [`export interface ${interfaceName}${base} {`];
	for (const [name, prop] of model.properties) {
		const {tsType} = resolveType(prop.type, {getInterfaceName, program});
		lines.push(`\t${name}${prop.optional ? "?" : ""}: ${tsType};`);
	}
	lines.push(`}`);
	return lines.join("\n");
}
