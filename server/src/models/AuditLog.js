import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String }
}, { timestamps: true });

auditLogSchema.index({ createdAt: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
