import {
	EmitContext,
	Enum,
	Model,
	ModelProperty,
	Type,
	Union,
	emitFile,
	getNamespaceFullName,
	isTemplateDeclaration,
	navigateProgram,
	resolvePath,
} from "@typespec/compiler";
import {
	MODEL_ROOT_STATE,
	SCHEMA_CONFIG_STATE,
	SCHEMA_IMMUTABLE_STATE,
	SCHEMA_INTERFACE_NAME_STATE,
	SCHEMA_INDEX_STATE,
	SCHEMA_REF_STATE,
	SCHEMA_ROOT_STATE,
	SchemaDecoratorConfig,
	SCHEMA_TIMESTAMPS_STATE,
} from "./lib.js";
import type {IndexDecoratorFlags} from "./decorators/index.js";
import {emitTypecriptInterface} from "./emitters/typescript/interfaceType.js";
import {emitTypescriptEnumType} from "./emitters/typescript/enumType.js";
import {resolveVirtualFields} from "./emitters/mongoose/virtuals.js";
import type {SchemaTimestampOverride} from "./emitters/mongoose/timestamp.js";
import {emitMongooseSchema, type EmitSchemaOptions} from "./emitters/mongoose/schema.js";

function isCompilerNamespace(name: string): boolean {
	return name === "TypeSpec" || name.startsWith("TypeSpec.");
}

function isLibraryNamespace(name: string): boolean {
	return name === "TypeSpecMongoose" || name.startsWith("TypeSpecMongoose.") || name === "TypeSpecOrm";
}

function isEmittableModel(model: Model): boolean {
	if (!model.name) return false;
	if (isTemplateDeclaration(model)) return false;
	if (
		model.namespace &&
		(isCompilerNamespace(getNamespaceFullName(model.namespace)) ||
			isLibraryNamespace(getNamespaceFullName(model.namespace)))
	) {
		return false;
	}
	return model.name !== "Array" && model.name !== "Record";
}

// ─── Scalar resolution ──────────────────────────────────────────────────────

function collectModelDependenciesFromType(type: Type, out: Set<Model>): void {
	if (type.kind === "Model") {
		const m = type as Model;
		if (m.indexer && m.indexer.key.name === "integer") {
			collectModelDependenciesFromType(m.indexer.value, out);
			return;
		}

		if (isEmittableModel(m)) {
			out.add(m);
			return;
		}

		for (const prop of m.properties.values()) {
			collectModelDependenciesFromType(prop.type, out);
		}
		return;
	}

	if (type.kind === "Union") {
		for (const variant of (type as Union).variants.values()) {
			collectModelDependenciesFromType(variant.type, out);
		}
	}
}

// ─── Schema field builder ────────────────────────────────────────────────────

function resolveInterfaceName(model: Model, interfaceNameByModel: Map<Model, string>): string {
	return interfaceNameByModel.get(model) ?? `I${model.name}`;
}

// ─── Topological sort ────────────────────────────────────────────────────────

function topoSort(models: Model[]): Model[] {
	const byName = new Map(models.map((m) => [m.name, m]));
	const sorted: Model[] = [];
	const visited = new Set<string>();

	function visit(m: Model) {
		if (visited.has(m.name)) return;
		visited.add(m.name);
		if (m.baseModel && byName.has(m.baseModel.name)) visit(m.baseModel);
		for (const prop of m.properties.values()) {
			const deps = new Set<Model>();
			collectModelDependenciesFromType(prop.type, deps);
			for (const dep of deps) {
				const depModel = byName.get(dep.name);
				if (depModel) visit(depModel);
			}
		}
		sorted.push(m);
	}

	for (const m of models) visit(m);
	return sorted;
}

export type GlobalProperties = {
	immutable: Set<ModelProperty>;
	indexFlags: Map<ModelProperty, IndexDecoratorFlags>;
	refTarget: Map<ModelProperty, string>;
};

export async function $onEmit(context: EmitContext) {
	const {program} = context;
	const modelByName = new Map<string, Model>();
	const enums: Enum[] = [];
	const seenEnums = new Set<string>();

	navigateProgram(program, {
		model(m) {
			if (!isEmittableModel(m)) return;
			modelByName.set(m.name, m);
		},
		enum(e) {
			if (seenEnums.has(e.name)) return;
			if (e.namespace && isCompilerNamespace(getNamespaceFullName(e.namespace))) return;
			seenEnums.add(e.name);
			enums.push(e);
		},
	});

	const globals: GlobalProperties = {
		immutable: new Set<ModelProperty>(),
		indexFlags: new Map<ModelProperty, IndexDecoratorFlags>(),
		refTarget: new Map<ModelProperty, string>(),
	};
	const explicitModelRoots = new Set<Model>();
	const explicitSchemaRoots = new Set<Model>();
	const schemaConfigByModel = new Map<Model, SchemaDecoratorConfig>();
	const interfaceNameByModel = new Map<Model, string>();
	const timestampOverrideByModel = new Map<Model, SchemaTimestampOverride>();
	for (const item of program.stateSet(MODEL_ROOT_STATE)) {
		if (item.kind !== "Model" || !isEmittableModel(item)) continue;
		const canonical = modelByName.get(item.name);
		if (canonical) explicitModelRoots.add(canonical);
	}

	for (const item of program.stateSet(SCHEMA_ROOT_STATE)) {
		if (item.kind !== "Model" || !isEmittableModel(item)) continue;
		const canonical = modelByName.get(item.name);
		if (canonical) explicitSchemaRoots.add(canonical);
	}

	for (const [item, config] of program.stateMap(SCHEMA_CONFIG_STATE)) {
		if (item.kind !== "Model" || !isEmittableModel(item)) continue;
		const canonical = modelByName.get(item.name);
		if (!canonical) continue;
		schemaConfigByModel.set(canonical, config as SchemaDecoratorConfig);
	}

	for (const [item, name] of program.stateMap(SCHEMA_INTERFACE_NAME_STATE)) {
		if (item.kind !== "Model") continue;
		if (typeof name !== "string") continue;
		const trimmed = name.trim();
		if (!trimmed) continue;
		const canonical = modelByName.get(item.name);
		if (!canonical) continue;
		interfaceNameByModel.set(canonical, trimmed);
	}

	for (const [item, refModelName] of program.stateMap(SCHEMA_REF_STATE)) {
		if (item.kind !== "ModelProperty") continue;
		if (typeof refModelName !== "string") continue;
		globals.refTarget.set(item, refModelName);
	}

	for (const [item, flags] of program.stateMap(SCHEMA_INDEX_STATE)) {
		if (item.kind !== "ModelProperty") continue;
		globals.indexFlags.set(item, flags);
	}

	for (const item of program.stateSet(SCHEMA_IMMUTABLE_STATE)) {
		if (item.kind !== "ModelProperty") continue;
		globals.immutable.add(item);
	}

	for (const [item, override] of program.stateMap(SCHEMA_TIMESTAMPS_STATE)) {
		if (item.kind !== "Model") continue;
		const canonical = modelByName.get(item.name);
		if (!canonical) continue;
		timestampOverrideByModel.set(canonical, override as SchemaTimestampOverride);
	}

	const traversalRoots = [...new Set([...explicitModelRoots, ...explicitSchemaRoots])];

	const selectedModels = new Set<Model>();
	const queue = [...traversalRoots];

	while (queue.length > 0) {
		const current = queue.shift()!;
		if (selectedModels.has(current)) continue;
		selectedModels.add(current);

		if (current.baseModel) {
			const base = modelByName.get(current.baseModel.name);
			if (base) queue.push(base);
		}

		for (const prop of current.properties.values()) {
			const deps = new Set<Model>();
			collectModelDependenciesFromType(prop.type, deps);
			for (const dep of deps) {
				const resolved = modelByName.get(dep.name);
				if (resolved) queue.push(resolved);
			}
		}
	}

	if (selectedModels.size === 0 && enums.length === 0) return;

	const sortedModels = topoSort([...selectedModels]);

	const parts: string[] = [`import mongoose from 'mongoose';`, ``];

	if (enums.length > 0) {
		for (const e of enums) {
			parts.push(emitTypescriptEnumType(e));
		}
		parts.push(``);
	}

	if (sortedModels.length > 0) {
		for (const m of sortedModels) {
			parts.push(emitTypecriptInterface(m, program, (model) => resolveInterfaceName(model, interfaceNameByModel)));
			parts.push(``);
		}

		for (const m of sortedModels) {
			const emitTopLevelModel = explicitModelRoots.has(m);
			const requiresSchema = explicitSchemaRoots.has(m) || emitTopLevelModel;
			if (!requiresSchema) {
				continue;
			}
			const currentSchema: EmitSchemaOptions = {
				interfaceName: resolveInterfaceName(m, interfaceNameByModel),
				emitTopLevelModel,
				modelTypeName: `${m.name}Model`,
				virtualTypeName: `${m.name}Virtuals`,
				virtualFields: resolveVirtualFields(schemaConfigByModel.get(m), timestampOverrideByModel.get(m)),
				config: schemaConfigByModel.get(m),
				timestampOverride: timestampOverrideByModel.get(m),
			};
			parts.push(emitMongooseSchema(program, m, currentSchema, globals));
			parts.push(``);
		}
	}

	await emitFile(program, {
		path: resolvePath(context.emitterOutputDir, "models.ts"),
		content: parts.join("\n"),
	});
}
