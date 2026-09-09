import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  adminId: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
  organizationType: 'school' | 'college' | 'industry' | null;
  hashedPassword?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema(
  {
    adminId: { type: String, required: true, unique: true, default: 'admin_darshan_patel' },
    name: { type: String, required: true, default: 'Dr. Darshan Patel' },
    email: { type: String, required: true, default: 'darshan.patel@staffsync.org' },
    role: { type: String, required: true, default: 'Administrator' },
    organizationId: { type: String, default: null },
    organizationType: { type: String, enum: ['school', 'college', 'industry', null], default: null },
    hashedPassword: { type: String, default: null },
  },
  { timestamps: true }
);

export const AdminModel = mongoose.model<IAdmin>('Admin', AdminSchema);
