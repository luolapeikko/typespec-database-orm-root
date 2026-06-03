import mongoose from 'mongoose';

export interface IAddress {
	street: string;
	zip: number;
}

export interface IUser {
	name: string;
	address: IAddress;
}

type AddressVirtuals = {};

type AddressModel = mongoose.Model<IAddress, {}, {}, AddressVirtuals>;

const AddressSchema = new mongoose.Schema<IAddress, AddressModel, {}, {}, AddressVirtuals>({
	street: { type: String, required: true },
	zip: { type: Number, required: true },
});

type UserVirtuals = {};

type UserModel = mongoose.Model<IUser, {}, {}, UserVirtuals>;

export const UserSchema = new mongoose.Schema<IUser, UserModel, {}, {}, UserVirtuals>({
	name: { type: String, required: true },
	address: { type: AddressSchema, required: true },
});

export type UserDocument = mongoose.HydratedDocumentFromSchema<typeof UserSchema>;

export const UserModel: UserModel = mongoose.model<IUser, UserModel>('User', UserSchema);
