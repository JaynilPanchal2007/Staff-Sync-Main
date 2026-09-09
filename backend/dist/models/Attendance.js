import mongoose, { Schema } from 'mongoose';
const AttendanceSchema = new Schema({
    attendanceId: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true, index: true },
    staffId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true },
    staffName: { type: String, required: true },
    date: { type: String, required: true, index: true },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'on_leave', 'break', 'off_duty'],
        required: true,
        default: 'present',
    },
    remarks: { type: String, default: '' },
}, { timestamps: true });
AttendanceSchema.index({ organizationId: 1, date: 1 });
AttendanceSchema.index({ staffId: 1, date: 1 });
export const AttendanceModel = mongoose.model('Attendance', AttendanceSchema);
