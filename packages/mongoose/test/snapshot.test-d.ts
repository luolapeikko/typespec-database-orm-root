import {assertType, describe, it} from "vitest";
import {Types} from "mongoose";
import {UserDocument} from "./snapshot/simple-model.js";
import {PostDocument} from "./snapshot/ref-index-decorators.js";
import {AuditLogDocument} from "./snapshot/timestamps-decorators.js";

describe("Core Type tests", () => {
	it("it should correctly assert types for PostDocument", () => {
		assertType<PostDocument["_id"]>(new Types.ObjectId());
		assertType<PostDocument["id"]>(new Types.ObjectId().toString());
	});
	it("it should correctly assert types for AuditLogDocument", () => {
		assertType<AuditLogDocument["created_on"]>(new Date());
		assertType<AuditLogDocument["updated_on"]>(new Date());
		assertType<AuditLogDocument["id"]>(new Types.ObjectId().toString());
	});
	it("it should correctly assert types for PostDocument", () => {
		assertType<UserDocument["_id"]>(new Types.ObjectId());
		assertType<UserDocument["id"]>(new Types.ObjectId().toString());
		assertType<UserDocument["name"]>("test");
	});
});
