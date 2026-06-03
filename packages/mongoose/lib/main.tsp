import "@typespec/compiler";
import "./main.js";

using TypeSpec.Reflection;

namespace TypeSpecMongoose;

model MongooseSchemaOptions {
	_id?: boolean;
	id?: boolean;
	expires?: string | numeric;
	timestamps?: boolean;
	collection?: string;
}

extern dec Model(target: Model);
extern dec Schema(target: Model, options?: valueof MongooseSchemaOptions);
extern dec collection(target: Model, collectionName: valueof string);
extern dec createdAt(target: Model, fieldName: valueof string);
extern dec updatedAt(target: Model, fieldName: valueof string);
extern dec ObjectId(target: Scalar);
extern dec text(target: ModelProperty);
extern dec sparse(target: ModelProperty);
