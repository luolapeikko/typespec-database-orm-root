import mongoose from 'mongoose';

export interface IAuditLog {
	message: string;
}

type AuditLogVirtuals = {
	readonly created_on: Date;
	readonly updated_on: Date;
};

type AuditLogModel = mongoose.Model<IAuditLog, {}, {}, AuditLogVirtuals>;

export const AuditLogSchema = new mongoose.Schema<IAuditLog, AuditLogModel, {}, {}, AuditLogVirtuals>({
	message: { type: String, required: true },
}, { timestamps: { createdAt: "created_on", updatedAt: "updated_on" } });

export type AuditLogDocument = mongoose.HydratedDocumentFromSchema<typeof AuditLogSchema>;

export const AuditLogModel: AuditLogModel = mongoose.model<IAuditLog, AuditLogModel>('AuditLog', AuditLogSchema);
