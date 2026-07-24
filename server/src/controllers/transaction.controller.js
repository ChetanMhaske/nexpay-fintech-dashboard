import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import { createAuditLog } from '../utils/helpers.js';

const BTC_TO_USD = 43250.00;
const ETH_TO_USD = 2280.00;

export const createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { type, amount, currency, description, recipientEmail } = req.body;
    const userId = req.user._id;

    let transaction;
    let userWallet = await Wallet.findOne({ user: userId, currency }).session(session);

    if (type !== 'crypto_buy' && type !== 'deposit' && !userWallet) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Wallet for ${currency} not found` });
    }

    if (type === 'deposit') {
      if (!userWallet) {
        userWallet = await Wallet.create([{ user: userId, currency, balance: amount }], { session });
        userWallet = userWallet[0];
      } else {
        userWallet = await Wallet.findOneAndUpdate(
          { _id: userWallet._id }, 
          { $inc: { balance: amount } }, 
          { new: true, session }
        );
      }
      transaction = await Transaction.create([{
        user: userId, type, amount, currency, status: 'complete', toWallet: userWallet._id, description
      }], { session });
      transaction = transaction[0];
      await createAuditLog('transaction.deposit', userId, { amount, currency }, req.ip, null, transaction._id);
    } 
    else if (type === 'withdraw') {
      userWallet = await Wallet.findOneAndUpdate(
        { _id: userWallet._id, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session }
      );
      if (!userWallet) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
      transaction = await Transaction.create([{
        user: userId, type, amount, currency, status: 'complete', fromWallet: userWallet._id, description
      }], { session });
      transaction = transaction[0];
      await createAuditLog('transaction.withdraw', userId, { amount, currency }, req.ip, null, transaction._id);
    } 
    else if (type === 'transfer') {
      const recipient = await User.findOne({ email: recipientEmail }).session(session);
      if (!recipient) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: 'Recipient not found' });
      }
      if (currency !== 'USD') {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Only USD transfers are allowed' });
      }
      
      userWallet = await Wallet.findOneAndUpdate(
        { _id: userWallet._id, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session }
      );
      if (!userWallet) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }
      
      let recipientWallet = await Wallet.findOne({ user: recipient._id, currency: 'USD' }).session(session);
      if (!recipientWallet) {
        recipientWallet = await Wallet.create([{ user: recipient._id, currency: 'USD', balance: amount }], { session });
        recipientWallet = recipientWallet[0];
      } else {
        recipientWallet = await Wallet.findOneAndUpdate(
          { _id: recipientWallet._id },
          { $inc: { balance: amount } },
          { new: true, session }
        );
      }

      transaction = await Transaction.create([{
        user: userId, type, amount, currency, status: 'complete', fromWallet: userWallet._id, toWallet: recipientWallet._id, description, recipientEmail
      }], { session });
      transaction = transaction[0];
      await createAuditLog('transaction.transfer', userId, { amount, currency, recipientEmail }, req.ip, recipient._id, transaction._id);
    } 
    else if (type === 'crypto_buy') {
      const rate = currency === 'BTC' ? BTC_TO_USD : ETH_TO_USD;
      const costInUSD = amount * rate;
      
      let usdWallet = await Wallet.findOneAndUpdate(
        { user: userId, currency: 'USD', balance: { $gte: costInUSD } },
        { $inc: { balance: -costInUSD } },
        { new: true, session }
      );
      
      if (!usdWallet) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Insufficient USD balance' });
      }
      
      if (!userWallet) {
        userWallet = await Wallet.create([{ user: userId, currency, balance: amount }], { session });
        userWallet = userWallet[0];
      } else {
        userWallet = await Wallet.findOneAndUpdate(
          { _id: userWallet._id },
          { $inc: { balance: amount } },
          { new: true, session }
        );
      }
      
      transaction = await Transaction.create([{
        user: userId, type, amount, currency, status: 'complete', toWallet: userWallet._id, fromWallet: usdWallet._id, metadata: { rate, costInUSD }, description
      }], { session });
      transaction = transaction[0];
      await createAuditLog('transaction.crypto_buy', userId, { amount, currency, costInUSD }, req.ip, null, transaction._id);
    } 
    else if (type === 'crypto_sell') {
      const rate = currency === 'BTC' ? BTC_TO_USD : ETH_TO_USD;
      const gainInUSD = amount * rate;
      
      userWallet = await Wallet.findOneAndUpdate(
        { _id: userWallet._id, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session }
      );

      if (!userWallet) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Insufficient crypto balance' });
      }
      
      let usdWallet = await Wallet.findOneAndUpdate(
        { user: userId, currency: 'USD' },
        { $inc: { balance: gainInUSD } },
        { new: true, session }
      );

      transaction = await Transaction.create([{
        user: userId, type, amount, currency, status: 'complete', fromWallet: userWallet._id, toWallet: usdWallet._id, metadata: { rate, gainInUSD }, description
      }], { session });
      transaction = transaction[0];
      await createAuditLog('transaction.crypto_sell', userId, { amount, currency, gainInUSD }, req.ip, null, transaction._id);
    }

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, data: transaction, message: 'Transaction created successfully' });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMyTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.status(200).json({ success: true, data: { transactions, total, page, pages }, message: 'Transactions fetched' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.status(200).json({ success: true, data: transaction, message: 'Transaction fetched' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
