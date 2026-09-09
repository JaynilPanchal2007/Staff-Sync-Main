import mongoose, { Schema } from 'mongoose';
const OrganizationSchema = new Schema({
    orgId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['school', 'college', 'industry'], required: true },
    address: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    workingDays: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    workingHours: {
        start: { type: String, default: '08:00' },
        end: { type: String, default: '17:00' },
    },
    timezone: { type: String, default: 'UTC+05:30' },
}, { timestamps: true });
export const OrganizationModel = mongoose.model('Organization', OrganizationSchema);
