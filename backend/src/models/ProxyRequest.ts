import mongoose, { Schema, Document } from 'mongoose';

export interface IProxyRequest extends Document {
  proxyRequestId: string;
  organizationId: string;
  gapId: string;
  fromStaffId: string;
  fromStaffName: string;
  targetStaffId: string;
  targetStaffName: string;
  targetEmployeeId?: string;
  workDetails?: {
    affectedType?: string;
    subject?: string;
    role?: string;
    classGrade?: string;
    section?: string;
    room?: string;
    date?: string;
    day?: string;
    startTime?: string;
    endTime?: string;
  };
  matchScore: number;
  reasons: string[];
  status: 'pending' | 'accepted' | 'rejected';
  respondedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProxyRequestSchema: Schema = new Schema(
  {
    proxyRequestId: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true, index: true },
    gapId: { type: String, required: true, index: true },
    fromStaffId: { type: String, required: true },
    fromStaffName: { type: String, required: true },
    targetStaffId: { type: String, required: true, index: true },
    targetStaffName: { type: String, required: true },
    targetEmployeeId: { type: String, default: '' },
    workDetails: { type: Schema.Types.Mixed, default: {} },
    matchScore: { type: Number, default: 90 },
    reasons: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    respondedAt: { type: String, default: '' },
  },
  { timestamps: true }
);

ProxyRequestSchema.index({ organizationId: 1, targetStaffId: 1 });

export const ProxyRequestModel = mongoose.model<IProxyRequest>('ProxyRequest', ProxyRequestSchema);
