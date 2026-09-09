import mongoose, { Schema } from 'mongoose';
const StaffSchema = new Schema({
    staffId: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    employeeId: { type: String, required: true, index: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    passwordHash: { type: String, default: '' },
    department: { type: String, default: 'General' },
    role: { type: String, default: 'Staff Member' },
    subjects: { type: [String], default: [] },
    classes: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    qualification: { type: String, default: 'Degree' },
    experience: { type: String, default: '3' },
    workingDays: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    availability: [
        {
            day: { type: String, required: true },
            available: { type: Boolean, default: true },
        },
    ],
    maxWorkload: { type: Number, default: 24 },
    maxWeeklyHours: { type: Number, default: 40 },
    assignedLectures: { type: Number, default: 0 },
    weeklyHours: { type: Number, default: 0 },
    proxyCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'deactivated'], default: 'active' },
}, { timestamps: true });
export const StaffModel = mongoose.model('Staff', StaffSchema);
