import type {Model, ModelProperty, Program} from "@typespec/compiler";
import type {SchemaDecoratorConfig} from "../../lib.js";
import type {SchemaTimestampOverride} from "./timestamp.js";
import {buildSchemaOptionsLiteral, emitMongooseVirtualsType, type MongooseVirtuals} from "./virtuals.js";
import type {GlobalProperties} from "../../emitter.js";
import {schemaField} from "./schemaField.js";
import {toSingleQuotedLiteral} from "./utils.js";

export type EmitSchemaOptions = {
	interfaceName: string;
	emitTopLevelModel: boolean;
	modelTypeName: string;
	virtualTypeName: string;
	virtualFields: MongooseVirtuals;
	config?: SchemaDecoratorConfig;
	timestampOverride?: SchemaTimestampOverride;
};

function collectAllProperties(model: Model): Map<string, ModelProperty> {
	const props = new Map<string, ModelProperty>();
	if (model.baseModel) {
		for (const [k, v] of collectAllProperties(model.baseModel)) props.set(k, v);
	}
	for (const [k, v] of model.properties) props.set(k, v);
	return props;
}

export function emitMongooseSchema(
	program: Program,
	model: Model,
	props: EmitSchemaOptions,
	global: GlobalProperties,
): string {
	const lines: string[] = [];
	const schemaOptionsLiteral = buildSchemaOptionsLiteral(props.config, props.timestampOverride);
	const allProps = collectAllProperties(model);
	const schemaConstKeyword = props.emitTopLevelModel ? "export const" : "const";
	lines.push(emitMongooseVirtualsType(props.virtualTypeName, props.virtualFields));
	lines.push(``);
	lines.push(`type ${props.modelTypeName} = mongoose.Model<${props.interfaceName}, {}, {}, ${props.virtualTypeName}>;`);
	lines.push(``);
	lines.push(
		`${schemaConstKeyword} ${model.name}Schema = new mongoose.Schema<${props.interfaceName}, ${props.modelTypeName}, {}, {}, ${props.virtualTypeName}>({`,
	);
	for (const [name, prop] of allProps) {
		lines.push(
			`\t${name}: ${schemaField(program, prop, global.refTarget.get(prop), global.indexFlags.get(prop), global.immutable.has(prop))},`,
		);
	}
	lines.push(`}${schemaOptionsLiteral ? `, ${schemaOptionsLiteral}` : ""});`);
	if (props.emitTopLevelModel) {
		lines.push(``);
		lines.push(`export type ${model.name}Document = mongoose.HydratedDocumentFromSchema<typeof ${model.name}Schema>;`);
		lines.push(``);
		const collectionArg = props.config?.collection ? `, ${toSingleQuotedLiteral(props.config.collection)}` : "";
		lines.push(
			`export const ${model.name}Model: ${props.modelTypeName} = mongoose.model<${props.interfaceName}, ${props.modelTypeName}>('${model.name}', ${model.name}Schema${collectionArg});`,
		);
	}
	return lines.join("\n");
}
