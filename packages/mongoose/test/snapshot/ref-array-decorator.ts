import mongoose from 'mongoose';

export interface ITeam {
	memberIds: mongoose.Types.ObjectId[];
}

type TeamVirtuals = {};

type TeamModel = mongoose.Model<ITeam, {}, {}, TeamVirtuals>;

export const TeamSchema = new mongoose.Schema<ITeam, TeamModel, {}, {}, TeamVirtuals>({
	memberIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: true },
});

export type TeamDocument = mongoose.HydratedDocumentFromSchema<typeof TeamSchema>;

export const TeamModel: TeamModel = mongoose.model<ITeam, TeamModel>('Team', TeamSchema);
