import mongoose from 'mongoose';

export interface IAddress {
	street: string;
	zip: number;
}

export interface IUser {
	name: string;
	address: IAddress;
}

type UserVirtuals = {};

type UserModel = mongoose.Model<IUser, {}, {}, UserVirtuals>;

export const UserSchema = new mongoose.Schema<IUser, UserModel, {}, {}, UserVirtuals>({
	name: { type: String, required: true },
	address: { type: Object, required: true },
});

export type UserDocument = mongoose.HydratedDocumentFromSchema<typeof UserSchema>;

export const UserModel: UserModel = mongoose.model<IUser, UserModel>('User', UserSchema);
