import mongoose from 'mongoose';

export interface IUser {
	name: string;
}

type UserVirtuals = {
	readonly createdAt: Date;
	readonly updatedAt: Date;
};

type UserModel = mongoose.Model<IUser, {}, {}, UserVirtuals>;

export const UserSchema = new mongoose.Schema<IUser, UserModel, {}, {}, UserVirtuals>({
	name: { type: String, required: true },
}, { _id: false, timestamps: true });

export type UserDocument = mongoose.HydratedDocumentFromSchema<typeof UserSchema>;

export const UserModel: UserModel = mongoose.model<IUser, UserModel>('User', UserSchema, 'users_v2');
