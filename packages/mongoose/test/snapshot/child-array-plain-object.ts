import mongoose from 'mongoose';

export interface IOffice {
	city: string;
	country: string;
}

export interface ICompany {
	name: string;
	offices: IOffice[];
}

type CompanyVirtuals = {};

type CompanyModel = mongoose.Model<ICompany, {}, {}, CompanyVirtuals>;

export const CompanySchema = new mongoose.Schema<ICompany, CompanyModel, {}, {}, CompanyVirtuals>({
	name: { type: String, required: true, default: "TestCompany" },
	offices: { type: [Object], required: true },
});

export type CompanyDocument = mongoose.HydratedDocumentFromSchema<typeof CompanySchema>;

export const CompanyModel: CompanyModel = mongoose.model<ICompany, CompanyModel>('Company', CompanySchema);
