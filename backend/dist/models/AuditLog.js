import mongoose, { Schema } from 'mongoose';
const AuditLogSchema = new Schema({
    logId: { type: String, required: true, unique: true },
    organizationId: { type: String, default: '', index: true },
    actor: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: '' },
    timestamp: { type: String, required: true, default: () => new Date().toISOString() },
    metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);
