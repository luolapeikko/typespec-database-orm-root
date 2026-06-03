import mongoose from 'mongoose';

export interface IUser {
	externalId: string;
}

type UserVirtuals = {};

type UserModel = mongoose.Model<IUser, {}, {}, UserVirtuals>;

export const UserSchema = new mongoose.Schema<IUser, UserModel, {}, {}, UserVirtuals>({
	externalId: { type: String, required: true, immutable: true },
});

export type UserDocument = mongoose.HydratedDocumentFromSchema<typeof UserSchema>;

export const UserModel: UserModel = mongoose.model<IUser, UserModel>('User', UserSchema);
