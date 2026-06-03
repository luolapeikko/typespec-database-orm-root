import mongoose from 'mongoose';

export interface IProduct {
	score: number;
}

type ProductVirtuals = {};

type ProductModel = mongoose.Model<IProduct, {}, {}, ProductVirtuals>;

export const ProductSchema = new mongoose.Schema<IProduct, ProductModel, {}, {}, ProductVirtuals>({
	score: { type: Number, required: true, min: 0, max: 100 },
});

export type ProductDocument = mongoose.HydratedDocumentFromSchema<typeof ProductSchema>;

export const ProductModel: ProductModel = mongoose.model<IProduct, ProductModel>('Product', ProductSchema);
