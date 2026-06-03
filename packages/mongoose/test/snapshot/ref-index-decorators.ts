import mongoose from 'mongoose';

export interface IPost {
	authorId: mongoose.Types.ObjectId;
}

type PostVirtuals = {};

type PostModel = mongoose.Model<IPost, {}, {}, PostVirtuals>;

export const PostSchema = new mongoose.Schema<IPost, PostModel, {}, {}, PostVirtuals>({
	authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, sparse: true },
});

export type PostDocument = mongoose.HydratedDocumentFromSchema<typeof PostSchema>;

export const PostModel: PostModel = mongoose.model<IPost, PostModel>('Post', PostSchema);
