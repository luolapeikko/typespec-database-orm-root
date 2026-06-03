import mongoose from 'mongoose';

export interface IUser {
	name: string;
}

type UserVirtuals = {
	readonly id: string;
};

type UserModel = mongoose.Model<IUser, {}, {}, UserVirtuals>;

export const UserSchema = new mongoose.Schema<IUser, UserModel, {}, {}, UserVirtuals>({
	name: { type: String, required: true },
}, { id: true });

export type UserDocument = mongoose.HydratedDocumentFromSchema<typeof UserSchema>;

export const UserModel: UserModel = mongoose.model<IUser, UserModel>('User', UserSchema);
