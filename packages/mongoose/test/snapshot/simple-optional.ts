import mongoose from 'mongoose';

export interface IProduct {
	title: string;
	description?: string;
	price: number;
}

type ProductVirtuals = {};

type ProductModel = mongoose.Model<IProduct, {}, {}, ProductVirtuals>;

export const ProductSchema = new mongoose.Schema<IProduct, ProductModel, {}, {}, ProductVirtuals>({
	title: { type: String, required: true },
	description: { type: String, required: false },
	price: { type: Number, required: true },
}, { id: false, expires: "7d" });

export type ProductDocument = mongoose.HydratedDocumentFromSchema<typeof ProductSchema>;

export const ProductModel: ProductModel = mongoose.model<IProduct, ProductModel>('Product', ProductSchema);
