import mongoose from 'mongoose';

export interface IUser {
	ownerId: mongoose.Types.ObjectId;
}

type UserVirtuals = {};

type UserModel = mongoose.Model<IUser, {}, {}, UserVirtuals>;

export const UserSchema = new mongoose.Schema<IUser, UserModel, {}, {}, UserVirtuals>({
	ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
});

export type UserDocument = mongoose.HydratedDocumentFromSchema<typeof UserSchema>;

export const UserModel: UserModel = mongoose.model<IUser, UserModel>('User', UserSchema);
