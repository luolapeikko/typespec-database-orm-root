import mongoose from 'mongoose';

export interface IPost {
	title: string;
	tags: string[];
}

type PostVirtuals = {};

type PostModel = mongoose.Model<IPost, {}, {}, PostVirtuals>;

export const PostSchema = new mongoose.Schema<IPost, PostModel, {}, {}, PostVirtuals>({
	title: { type: String, required: true },
	tags: { type: [String], required: true },
});

export type PostDocument = mongoose.HydratedDocumentFromSchema<typeof PostSchema>;

export const PostModel: PostModel = mongoose.model<IPost, PostModel>('Post', PostSchema);
