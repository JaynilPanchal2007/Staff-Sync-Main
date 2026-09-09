import mongoose, { Schema } from 'mongoose';
const ProxyRequestSchema = new Schema({
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
}, { timestamps: true });
ProxyRequestSchema.index({ organizationId: 1, targetStaffId: 1 });
export const ProxyRequestModel = mongoose.model('ProxyRequest', ProxyRequestSchema);
