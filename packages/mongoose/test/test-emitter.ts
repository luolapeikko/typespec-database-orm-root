import {Diagnostic, resolvePath} from "@typespec/compiler";
import {
	createTestHost,
	createTestWrapper,
	expectDiagnosticEmpty,
	resolveVirtualPath,
	type TypeSpecTestLibrary,
} from "@typespec/compiler/testing";

const emitterName = "typespec-mongoose-emitter";

function createPackageLibrary(name: string, packageRoot: string): TypeSpecTestLibrary {
	return {
		name,
		packageRoot,
		files: [
			{realDir: "", pattern: "package.json", virtualPath: `./node_modules/${name}`},
			{realDir: "lib", pattern: "**/*.tsp", virtualPath: `./node_modules/${name}/lib`},
			{realDir: "lib", pattern: "**/*.js", virtualPath: `./node_modules/${name}/lib`},
			{realDir: "dist/src", pattern: "**/*.js", virtualPath: `./node_modules/${name}/dist/src`},
		],
	};
}

function createCompilerLibrary(packageRoot: string): TypeSpecTestLibrary {
	return {
		name: "@typespec/compiler",
		packageRoot,
		files: [
			{realDir: "", pattern: "package.json", virtualPath: "./node_modules/@typespec/compiler"},
			{realDir: "lib", pattern: "**/*.tsp", virtualPath: "./node_modules/@typespec/compiler/lib"},
		],
	};
}

const host = await createTestHost({
	libraries: [
		createCompilerLibrary(resolvePath(import.meta.dirname, "../../../node_modules/@typespec/compiler")),
		createPackageLibrary(emitterName, resolvePath(import.meta.dirname, "..")),
		createPackageLibrary("typespec-orm-common", resolvePath(import.meta.dirname, "../../orm-common")),
	],
});

export const Tester = createTestWrapper(host, {
	autoImports: [],
});

export async function emitWithDiagnostics(code: string): Promise<[Record<string, string>, readonly Diagnostic[]]> {
	const [, diagnostics] = await Tester.compileAndDiagnose(code, {
		outputDir: "tsp-output",
		emit: [emitterName],
	});
	const outputs: Record<string, string> = {};
	const outputDir = resolveVirtualPath(`tsp-output/${emitterName}`);
	for (const [name, value] of host.fs) {
		if (name.startsWith(outputDir)) {
			outputs[name.slice(outputDir.length + 1)] = value;
		}
	}
	return [outputs, diagnostics];
}

export async function emit(code: string): Promise<Record<string, string>> {
	const [result, diagnostics] = await emitWithDiagnostics(code);
	expectDiagnosticEmpty(diagnostics);
	return result;
}
