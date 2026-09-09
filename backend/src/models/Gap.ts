import mongoose, { Schema, Document } from 'mongoose';

export interface IGap extends Document {
  gapId: string;
  organizationId: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  affectedType: 'lecture' | 'shift';
  targetItem?: any;
  absentStaffId: string;
  absentStaffName: string;
  absentEmployeeId?: string;
  subject?: string;
  classGrade?: string;
  section?: string;
  room?: string;
  role?: string;
  department?: string;
  requiredSkills?: string[];
  requiredSkillsOrSubject?: string;
  status: 'unresolved' | 'candidates_found' | 'request_sent' | 'resolved' | 'accepted';
  candidateCount?: number;
  recommendedCandidate?: any;
  assignedTargetStaffId?: string;
  assignedTargetStaffName?: string;
  proxyRequestId?: string;
  resolvedByStaffId?: string;
  resolvedByStaffName?: string;
  resolvedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GapSchema: Schema = new Schema(
  {
    gapId: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    affectedType: { type: String, enum: ['lecture', 'shift'], required: true },
    targetItem: { type: Schema.Types.Mixed, default: null },
    absentStaffId: { type: String, required: true },
    absentStaffName: { type: String, required: true },
    absentEmployeeId: { type: String, default: '' },
    subject: { type: String, default: '' },
    classGrade: { type: String, default: '' },
    section: { type: String, default: '' },
    room: { type: String, default: '' },
    role: { type: String, default: '' },
    department: { type: String, default: '' },
    requiredSkills: { type: [String], default: [] },
    requiredSkillsOrSubject: { type: String, default: '' },
    status: {
      type: String,
      enum: ['unresolved', 'candidates_found', 'request_sent', 'resolved', 'accepted'],
      default: 'unresolved',
    },
    candidateCount: { type: Number, default: 0 },
    recommendedCandidate: { type: Schema.Types.Mixed, default: null },
    assignedTargetStaffId: { type: String, default: '' },
    assignedTargetStaffName: { type: String, default: '' },
    proxyRequestId: { type: String, default: '' },
    resolvedByStaffId: { type: String, default: '' },
    resolvedByStaffName: { type: String, default: '' },
    resolvedAt: { type: String, default: '' },
  },
  { timestamps: true }
);

GapSchema.index({ organizationId: 1, status: 1 });

export const GapModel = mongoose.model<IGap>('Gap', GapSchema);
