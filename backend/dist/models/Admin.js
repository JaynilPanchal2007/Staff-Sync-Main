import mongoose, { Schema } from 'mongoose';
const AdminSchema = new Schema({
    adminId: { type: String, required: true, unique: true, default: 'admin_darshan_patel' },
    name: { type: String, required: true, default: 'Dr. Darshan Patel' },
    email: { type: String, required: true, default: 'darshan.patel@staffsync.org' },
    role: { type: String, required: true, default: 'Administrator' },
    organizationId: { type: String, default: null },
    organizationType: { type: String, enum: ['school', 'college', 'industry', null], default: null },
    hashedPassword: { type: String, default: null },
}, { timestamps: true });
export const AdminModel = mongoose.model('Admin', AdminSchema);
