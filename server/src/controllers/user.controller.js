import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import { createAuditLog } from '../utils/helpers.js';

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').skip(skip).limit(limit);
    const total = await User.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.status(200).json({ success: true, data: { users, total, page, pages }, message: 'Users fetched' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const wallets = await Wallet.find({ user: user._id });
    res.status(200).json({ success: true, data: { user, wallets }, message: 'User fetched' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const oldRole = user.role;
    user.role = req.body.role;
    await user.save();

    await createAuditLog('user.role_updated', req.user._id, { oldRole, newRole: user.role }, req.ip, user._id);
    res.status(200).json({ success: true, data: user, message: 'Role updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const freezeUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    user.isFrozen = req.body.isFrozen;
    await user.save();

    await createAuditLog(req.body.isFrozen ? 'user.frozen' : 'user.unfrozen', req.user._id, {}, req.ip, user._id);
    res.status(200).json({ success: true, data: user, message: `User ${user.isFrozen ? 'frozen' : 'unfrozen'}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;

    const transactions = await Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email');
    const total = await Transaction.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.status(200).json({ success: true, data: { transactions, total, page, pages }, message: 'Transactions fetched' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
