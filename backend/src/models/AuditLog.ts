import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  logId: string;
  organizationId?: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  timestamp: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    logId: { type: String, required: true, unique: true },
    organizationId: { type: String, default: '', index: true },
    actor: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: '' },
    timestamp: { type: String, required: true, default: () => new Date().toISOString() },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
