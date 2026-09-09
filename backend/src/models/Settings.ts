import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  organizationId?: string;
  scoringWeights: {
    compatibility: number;
    availability: number;
    conflict: number;
    workload: number;
    fairness: number;
    experience: number;
  };
  workingHours: { start: string; end: string };
  maxWeeklyHours: number;
  maxWorkloadLectures: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    organizationId: { type: String, default: 'global' },
    scoringWeights: {
      compatibility: { type: Number, default: 30 },
      availability: { type: Number, default: 20 },
      conflict: { type: Number, default: 15 },
      workload: { type: Number, default: 15 },
      fairness: { type: Number, default: 10 },
      experience: { type: Number, default: 10 },
    },
    workingHours: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '17:00' },
    },
    maxWeeklyHours: { type: Number, default: 40 },
    maxWorkloadLectures: { type: Number, default: 24 },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<ISettings>('Settings', SettingsSchema);
