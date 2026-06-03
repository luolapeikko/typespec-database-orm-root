import mongoose from 'mongoose';

export interface IUser {
	id: mongoose.Types.ObjectId;
}

export interface IPost {
	authorId: mongoose.Types.ObjectId;
}

type UserVirtuals = {};

type UserModel = mongoose.Model<IUser, {}, {}, UserVirtuals>;

export const UserSchema = new mongoose.Schema<IUser, UserModel, {}, {}, UserVirtuals>({
	id: { type: mongoose.Schema.Types.ObjectId, required: true },
});

export type UserDocument = mongoose.HydratedDocumentFromSchema<typeof UserSchema>;

export const UserModel: UserModel = mongoose.model<IUser, UserModel>('User', UserSchema);

type PostVirtuals = {};

type PostModel = mongoose.Model<IPost, {}, {}, PostVirtuals>;

export const PostSchema = new mongoose.Schema<IPost, PostModel, {}, {}, PostVirtuals>({
	authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

export type PostDocument = mongoose.HydratedDocumentFromSchema<typeof PostSchema>;

export const PostModel: PostModel = mongoose.model<IPost, PostModel>('Post', PostSchema);
