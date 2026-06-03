import mongoose from 'mongoose';

export interface ICompany {
	name: string;
}

type CompanyVirtuals = {};

type CompanyModel = mongoose.Model<ICompany, {}, {}, CompanyVirtuals>;

export const CompanySchema = new mongoose.Schema<ICompany, CompanyModel, {}, {}, CompanyVirtuals>({
	name: { type: String, required: true },
});

export type CompanyDocument = mongoose.HydratedDocumentFromSchema<typeof CompanySchema>;

export const CompanyModel: CompanyModel = mongoose.model<ICompany, CompanyModel>('Company', CompanySchema, 'companies_v2');
