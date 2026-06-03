import mongoose from 'mongoose';

export interface DbUser {
	name: string;
}

export interface ISession {
	user: DbUser;
}

type UserVirtuals = {};

type UserModel = mongoose.Model<DbUser, {}, {}, UserVirtuals>;

export const UserSchema = new mongoose.Schema<DbUser, UserModel, {}, {}, UserVirtuals>({
	name: { type: String, required: true },
});

export type UserDocument = mongoose.HydratedDocumentFromSchema<typeof UserSchema>;

export const UserModel: UserModel = mongoose.model<DbUser, UserModel>('User', UserSchema);

type SessionVirtuals = {};

type SessionModel = mongoose.Model<ISession, {}, {}, SessionVirtuals>;

export const SessionSchema = new mongoose.Schema<ISession, SessionModel, {}, {}, SessionVirtuals>({
	user: { type: UserSchema, required: true },
});

export type SessionDocument = mongoose.HydratedDocumentFromSchema<typeof SessionSchema>;

export const SessionModel: SessionModel = mongoose.model<ISession, SessionModel>('Session', SessionSchema);
