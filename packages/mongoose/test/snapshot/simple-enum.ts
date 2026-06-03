import mongoose from 'mongoose';

export type Status = "active" | "inactive";

export interface IItem {
	name: string;
	status: Status;
}

type ItemVirtuals = {};

type ItemModel = mongoose.Model<IItem, {}, {}, ItemVirtuals>;

export const ItemSchema = new mongoose.Schema<IItem, ItemModel, {}, {}, ItemVirtuals>({
	name: { type: String, required: true },
	status: { type: String, enum: ["active", "inactive"], required: true },
});

export type ItemDocument = mongoose.HydratedDocumentFromSchema<typeof ItemSchema>;

export const ItemModel: ItemModel = mongoose.model<IItem, ItemModel>('Item', ItemSchema);
