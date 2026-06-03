import mongoose from 'mongoose';

export interface IArticle {
	slug: string;
	title: string;
	subtitle?: string;
	createdAt: Date;
}

type ArticleVirtuals = {};

type ArticleModel = mongoose.Model<IArticle, {}, {}, ArticleVirtuals>;

export const ArticleSchema = new mongoose.Schema<IArticle, ArticleModel, {}, {}, ArticleVirtuals>({
	slug: { type: String, required: true, unique: true },
	title: { type: String, required: true, text: true },
	subtitle: { type: String, required: false, sparse: true },
	createdAt: { type: Date, required: true, index: true },
});

export type ArticleDocument = mongoose.HydratedDocumentFromSchema<typeof ArticleSchema>;

export const ArticleModel: ArticleModel = mongoose.model<IArticle, ArticleModel>('Article', ArticleSchema);
