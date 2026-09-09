import mongoose, { Schema } from 'mongoose';
const ShiftSchema = new Schema({
    shiftId: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    employeeCustomId: { type: String, default: '' },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    department: { type: String, default: 'Operations' },
    role: { type: String, default: 'Operator' },
    requiredSkills: { type: [String], default: [] },
    location: { type: String, default: 'Main Facility' },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled',
    },
}, { timestamps: true });
ShiftSchema.index({ organizationId: 1, date: 1 });
export const ShiftModel = mongoose.model('Shift', ShiftSchema);
