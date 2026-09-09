import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  notificationId: string;
  organizationId: string;
  targetStaffId?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    notificationId: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true, index: true },
    targetStaffId: { type: String, default: '', index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

NotificationSchema.index({ organizationId: 1, targetStaffId: 1 });

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
