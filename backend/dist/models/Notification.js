import mongoose, { Schema } from 'mongoose';
const NotificationSchema = new Schema({
    notificationId: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true, index: true },
    targetStaffId: { type: String, default: '', index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
NotificationSchema.index({ organizationId: 1, targetStaffId: 1 });
export const NotificationModel = mongoose.model('Notification', NotificationSchema);
