import mongoose from 'mongoose';

export interface IEvent {
	name: string;
	createdAt: Date;
}

type EventVirtuals = {};

type EventModel = mongoose.Model<IEvent, {}, {}, EventVirtuals>;

export const EventSchema = new mongoose.Schema<IEvent, EventModel, {}, {}, EventVirtuals>({
	name: { type: String, required: true },
	createdAt: { type: Date, required: true },
});

export type EventDocument = mongoose.HydratedDocumentFromSchema<typeof EventSchema>;

export const EventModel: EventModel = mongoose.model<IEvent, EventModel>('Event', EventSchema);
