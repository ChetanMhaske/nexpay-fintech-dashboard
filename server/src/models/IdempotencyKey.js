import mongoose from 'mongoose';

const idempotencyKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  responseBody: { type: mongoose.Schema.Types.Mixed },
  statusCode: { type: Number },
  createdAt: { type: Date, default: Date.now, expires: 300 } // TTL index: 300 seconds (5 minutes)
});

export default mongoose.model('IdempotencyKey', idempotencyKeySchema);
