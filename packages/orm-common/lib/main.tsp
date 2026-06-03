import "@typespec/compiler";
import "./main.js";

using TypeSpec.Reflection;

namespace TypeSpecOrm;

extern dec unique(target: ModelProperty);
extern dec index(target: ModelProperty);
extern dec immutable(target: ModelProperty);
extern dec interfaceName(target: Model, name: valueof string);
extern dec ref(target: ModelProperty, modelName: valueof string);
