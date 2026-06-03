import mongoose from 'mongoose';

export interface IBase {
	id: string;
}

export interface IUser extends IBase {
	name: string;
}

type UserVirtuals = {};

type UserModel = mongoose.Model<IUser, {}, {}, UserVirtuals>;

export const UserSchema = new mongoose.Schema<IUser, UserModel, {}, {}, UserVirtuals>({
	id: { type: String, required: true },
	name: { type: String, required: true },
});

export type UserDocument = mongoose.HydratedDocumentFromSchema<typeof UserSchema>;

export const UserModel: UserModel = mongoose.model<IUser, UserModel>('User', UserSchema);
