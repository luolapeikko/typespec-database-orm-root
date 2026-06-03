import {describe, expect, it} from "vitest";
import {emit} from "./test-emitter.js";

describe("mongoose emitter", () => {
	it("emits interface and schema for a simple model", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      model User {
        name: string;
        age: int32;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/simple-model.ts");
	});

	it("marks optional properties correctly", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      @TypeSpecMongoose.Schema(#{ id: false, expires: "7d" })
      model Product {
        title: string;
        description?: string;
        price: float64;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/simple-optional.ts");
	});

	it("emits enum type alias and uses it in interface and schema", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      enum Status { Active: "active", Inactive: "inactive" }

      @TypeSpecMongoose.Model
      model Item {
        name: string;
        status: Status;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/simple-enum.ts");
	});

	it("emits array properties", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      model Post {
        title: string;
        tags: string[];
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/simple-array.ts");
	});

	it("handles model inheritance", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      model Base {
        id: string;
      }

      @TypeSpecMongoose.Model
      model User extends Base {
        name: string;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/model-inheritance.ts");
	});

	it("handles datetime scalar", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      model Event {
        name: string;
        createdAt: utcDateTime;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/datetime-scalar.ts");
	});

	it("supports overriding emitted interface name", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";
      import "typespec-orm-common";

      @TypeSpecMongoose.Model
      @TypeSpecOrm.interfaceName("DbUser")
      model User {
        name: string;
      }

      @TypeSpecMongoose.Model
      model Session {
        user: User;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/interface-name-override.ts");
	});

	it("uses @TypeSpecMongoose.Schema on child model and keeps it as subdocument schema", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      model User {
        name: string;
        address: Address;
      }

      @TypeSpecMongoose.Schema
      model Address {
        street: string;
        zip: int32;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/child-schema.ts");
	});

	it("uses plain Object for undecorated child model", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      model User {
        name: string;
        address: Address;
      }

      model Address {
        street: string;
        zip: int32;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/child-plain-object.ts");
	});

	it("uses plain Object for undecorated child model arrays", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      model Company {
        name: string = "TestCompany";
        offices: Office[];
      }

      model Office {
        city: string;
        country: string;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/child-array-plain-object.ts");
	});

	it("supports schema options object and collection override", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      @TypeSpecMongoose.Schema(#{ _id: false, timestamps: true, collection: "users_v2" })
      model User {
        name: string;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/schema-base-options.ts");
	});

	it("adds id virtual when schema options include id: true", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      @TypeSpecMongoose.Schema(#{ id: true })
      model User {
        name: string;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/schema-id-virtual.ts");
	});

	it("supports @TypeSpecMongoose.collection decorator", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      @TypeSpecMongoose.collection("companies_v2")
      model Company {
        name: string;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/collection-decorator.ts");
	});

	it("supports @TypeSpecMongoose.createdAt and @TypeSpecMongoose.updatedAt", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      @TypeSpecMongoose.Schema(#{ timestamps: true })
      @TypeSpecMongoose.createdAt("created_on")
      @TypeSpecMongoose.updatedAt("updated_on")
      model AuditLog {
        message: string;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/timestamps-decorators.ts");
	});

	it("supports @TypeSpecMongoose.ObjectId scalar mapping", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.ObjectId
      scalar UserId;

      @TypeSpecMongoose.Model
      model User {
        ownerId: UserId;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/objectid-scalar.ts");
	});

	it("supports arrays of @TypeSpecMongoose.ObjectId scalars", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.ObjectId
      scalar UserId;

      @TypeSpecMongoose.Model
      model Team {
        memberIds: UserId[];
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/objectid-array-scalar.ts");
	});

	it("supports @TypeSpecMongoose.ref for ObjectId", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";
      import "typespec-orm-common";

      @TypeSpecMongoose.ObjectId
      scalar UserId;

      @TypeSpecMongoose.Model
      model User {
        id: UserId;
      }

      @TypeSpecMongoose.Model
      model Post {
        @TypeSpecOrm.ref("User")
        authorId: UserId;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/ref-decorator.ts");
	});

	it("supports @TypeSpecMongoose.ref for ObjectId arrays", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";
      import "typespec-orm-common";

      @TypeSpecMongoose.ObjectId
      scalar UserId;

      @TypeSpecMongoose.Model
      model Team {
        @TypeSpecOrm.ref("User")
        memberIds: UserId[];
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/ref-array-decorator.ts");
	});

	it("supports boolean index decorators", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";
      import "typespec-orm-common";

      @TypeSpecMongoose.Model
      model Article {
        @TypeSpecOrm.unique
        slug: string;

        @TypeSpecMongoose.text
        title: string;

        @TypeSpecMongoose.sparse
        subtitle?: string;

        @TypeSpecOrm.index
        createdAt: utcDateTime;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/boolean-index-decorators.ts");
	});

	it("supports combined ref and index flags", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";
      import "typespec-orm-common";

      @TypeSpecMongoose.ObjectId
      scalar UserId;

      @TypeSpecMongoose.Model
      model Post {
        @TypeSpecOrm.ref("User")
        @TypeSpecOrm.index
        @TypeSpecMongoose.sparse
        authorId: UserId;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/ref-index-decorators.ts");
	});

	it("supports @minLength and @maxLength for string fields", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      model User {
        @minLength(3)
        @maxLength(64)
        username: string;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/std-min-max-length-decorators.ts");
	});

	it("supports @pattern for string fields", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      model User {
        @pattern("^[a-z0-9]+$")
        username: string;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/std-pattern-decorator.ts");
	});

	it("supports @minValue and @maxValue for number fields", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";

      @TypeSpecMongoose.Model
      model Product {
        @minValue(0)
        @maxValue(100)
        score: int32;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/std-min-max-value-decorators.ts");
	});

	it("supports @TypeSpecOrm.immutable", async () => {
		const results = await emit(`
      import "typespec-mongoose-emitter";
      import "typespec-orm-common";

      @TypeSpecMongoose.Model
      model User {
        @TypeSpecOrm.immutable
        externalId: string;
      }
    `);
		await expect(results["models.ts"]).toMatchFileSnapshot("./snapshot/immutable-decorator.ts");
	});
});
