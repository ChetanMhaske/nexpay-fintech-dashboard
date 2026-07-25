import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['transfer', 'deposit', 'withdraw', 'crypto_buy', 'crypto_sell'], required: true },
  fromWallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  toWallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  amount: { type: Number, required: true, min: 0.00000001 },
  currency: { type: String, required: true },
  status: { type: String, enum: ['pending', 'complete', 'failed'], default: 'pending' },
  description: { type: String },
  recipientEmail: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  reversed: { type: Boolean, default: false }
}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
