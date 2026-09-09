import mongoose, { Schema } from 'mongoose';
const TimetableSchema = new Schema({
    timetableId: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true, index: true },
    facultyId: { type: String, required: true, index: true },
    facultyName: { type: String, required: true },
    facultyEmployeeId: { type: String, default: '' },
    subject: { type: String, required: true },
    day: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    classGrade: { type: String, default: 'Year 1' },
    section: { type: String, default: 'A' },
    room: { type: String, default: 'Room 101' },
}, { timestamps: true });
TimetableSchema.index({ organizationId: 1, facultyId: 1 });
export const TimetableModel = mongoose.model('Timetable', TimetableSchema);
