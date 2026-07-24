import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async (action, performedBy, details, ipAddress, targetUser = null, targetTransaction = null) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      targetUser,
      targetTransaction,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};
