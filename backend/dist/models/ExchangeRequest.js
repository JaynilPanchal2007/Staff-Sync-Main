import mongoose, { Schema } from 'mongoose';
const ExchangeRequestSchema = new Schema({
    exchangeId: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true, index: true },
    sourceTimetableId: { type: String, required: true },
    sourceFacultyId: { type: String, required: true },
    sourceFacultyName: { type: String, required: true },
    targetTimetableId: { type: String, required: true },
    targetFacultyId: { type: String, required: true },
    targetFacultyName: { type: String, required: true },
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subject: { type: String, default: '' },
    note: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    respondedAt: { type: String, default: '' },
}, { timestamps: true });
ExchangeRequestSchema.index({ organizationId: 1, status: 1 });
export const ExchangeRequestModel = mongoose.model('ExchangeRequest', ExchangeRequestSchema);
