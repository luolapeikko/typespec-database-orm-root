import mongoose from 'mongoose';

export interface IUser {
	username: string;
}

type UserVirtuals = {};

type UserModel = mongoose.Model<IUser, {}, {}, UserVirtuals>;

export const UserSchema = new mongoose.Schema<IUser, UserModel, {}, {}, UserVirtuals>({
	username: { type: String, required: true, validate: { validator: (v: string) => new RegExp("^[a-z0-9]+$").test(v) } },
});

export type UserDocument = mongoose.HydratedDocumentFromSchema<typeof UserSchema>;

export const UserModel: UserModel = mongoose.model<IUser, UserModel>('User', UserSchema);
