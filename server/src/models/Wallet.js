import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currency: { type: String, enum: ['USD', 'BTC', 'ETH'], required: true },
  balance: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

walletSchema.index({ user: 1, currency: 1 }, { unique: true });

const Wallet = mongoose.model('Wallet', walletSchema);
export default Wallet;
