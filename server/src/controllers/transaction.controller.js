import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import User from '../models/User.js';
import IdempotencyKey from '../models/IdempotencyKey.js';
import { createAuditLog } from '../utils/helpers.js';

const BTC_TO_USD = 43250.00;
const ETH_TO_USD = 2280.00;

export const createTransaction = async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
  
  if (idempotencyKey) {
    try {
      const existingKey = await IdempotencyKey.findOne({ key: idempotencyKey });
      if (existingKey) {
        if (existingKey.responseBody) {
          return res.status(existingKey.statusCode || 200).json(existingKey.responseBody);
        } else {
          return res.status(409).json({ success: false, message: 'Request already in progress. Please try again.' });
        }
      }
      await IdempotencyKey.create({ key: idempotencyKey });
    } catch (err) {
      if (err.code === 11000) {
         const existingKey = await IdempotencyKey.findOne({ key: idempotencyKey });
         if (existingKey && existingKey.responseBody) return res.status(existingKey.statusCode).json(existingKey.responseBody);
         return res.status(409).json({ success: false, message: 'Request already in progress. Please try again.' });
      }
    }
  }

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
    
    const responsePayload = { success: true, data: transaction, message: 'Transaction created successfully' };
    if (idempotencyKey) {
      await IdempotencyKey.updateOne({ key: idempotencyKey }, { responseBody: responsePayload, statusCode: 201 });
    }
    return res.status(201).json(responsePayload);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    // Catch Mongoose transaction conflicts
    if ((error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) || error.code === 112 || error.name === 'WriteConflict') {
      if (idempotencyKey) await IdempotencyKey.deleteOne({ key: idempotencyKey });
      return res.status(409).json({ success: false, message: 'This transaction conflicted with another request. Please try again.' });
    }
    
    console.error(error);
    if (idempotencyKey) await IdempotencyKey.deleteOne({ key: idempotencyKey });
    return res.status(500).json({ success: false, message: 'Server error' });
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

export const reverseTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const txId = req.params.id;
    const transaction = await Transaction.findById(txId).session(session);

    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.reversed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Transaction is already reversed' });
    }

    const { type, amount, currency, user: userId, fromWallet, toWallet, metadata } = transaction;

    if (type === 'deposit') {
      const wallet = await Wallet.findOneAndUpdate(
        { _id: toWallet, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session }
      );
      if (!wallet) throw new Error('Insufficient balance to reverse deposit');
    } else if (type === 'withdraw') {
      await Wallet.findOneAndUpdate(
        { _id: fromWallet },
        { $inc: { balance: amount } },
        { new: true, session }
      );
    } else if (type === 'transfer') {
      const senderWallet = await Wallet.findOneAndUpdate(
        { _id: fromWallet },
        { $inc: { balance: amount } },
        { new: true, session }
      );
      const recipientWallet = await Wallet.findOneAndUpdate(
        { _id: toWallet, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session }
      );
      if (!recipientWallet) throw new Error('Insufficient balance in recipient wallet to reverse transfer');
    } else if (type === 'crypto_buy') {
      const { costInUSD } = metadata;
      const cryptoWallet = await Wallet.findOneAndUpdate(
        { _id: toWallet, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session }
      );
      if (!cryptoWallet) throw new Error('Insufficient crypto balance to reverse buy');
      
      await Wallet.findOneAndUpdate(
        { _id: fromWallet },
        { $inc: { balance: costInUSD } },
        { new: true, session }
      );
    } else if (type === 'crypto_sell') {
      const { gainInUSD } = metadata;
      const usdWallet = await Wallet.findOneAndUpdate(
        { _id: toWallet, balance: { $gte: gainInUSD } },
        { $inc: { balance: -gainInUSD } },
        { new: true, session }
      );
      if (!usdWallet) throw new Error('Insufficient USD balance to reverse sell');
      
      await Wallet.findOneAndUpdate(
        { _id: fromWallet },
        { $inc: { balance: amount } },
        { new: true, session }
      );
    }

    transaction.reversed = true;
    await transaction.save({ session });

    await createAuditLog('transaction.reverse', req.user._id, { originalTxId: txId, type, amount, currency }, req.ip, userId, txId);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, data: transaction, message: 'Transaction reversed successfully' });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error(error);
    return res.status(400).json({ success: false, message: error.message || 'Server error during reversal' });
  }
};
