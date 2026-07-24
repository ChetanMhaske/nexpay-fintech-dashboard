import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin', 'auditor'], default: 'user' },
  googleId: { type: String, sparse: true },
  githubId: { type: String, sparse: true },
  avatar: { type: String },
  isFrozen: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
