import type {DecoratorContext, ModelProperty} from "@typespec/compiler";
import {SCHEMA_INDEX_STATE} from "../lib.js";
import {updateObject} from "./utils.js";

export interface IndexDecoratorFlags {
	unique?: boolean;
	text?: boolean;
	sparse?: boolean;
	index?: boolean;
}

export function setIndexFlag(context: DecoratorContext, target: ModelProperty, key: keyof IndexDecoratorFlags): void {
	updateObject<IndexDecoratorFlags>(context.program.stateMap(SCHEMA_INDEX_STATE), target, {[key]: true});
}
