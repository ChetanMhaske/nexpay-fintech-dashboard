import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import RefreshToken from '../models/RefreshToken.js';
import { createAuditLog } from '../utils/helpers.js';
import crypto from 'crypto';
import ms from 'ms';

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
};

const generateRefreshToken = async (user) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'));
  
  await RefreshToken.create({
    token,
    user: user._id,
    expiresAt
  });

  return token;
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: ms(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'),
    path: '/'
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    await Wallet.insertMany([
      { user: user._id, currency: 'USD', balance: 1000 },
      { user: user._id, currency: 'BTC', balance: 0.5 },
      { user: user._id, currency: 'ETH', balance: 2.0 }
    ]);

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    await createAuditLog('user.register', user._id, { method: 'local' }, req.ip, user._id);

    const userData = { _id: user._id, name: user.name, email: user.email, role: user.role };
    res.status(201).json({ success: true, data: { user: userData, accessToken }, message: 'Registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.isFrozen) {
      return res.status(403).json({ success: false, message: 'Account is frozen' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);

    await createAuditLog('user.login', user._id, { method: 'local' }, req.ip, user._id);

    const userData = { _id: user._id, name: user.name, email: user.email, role: user.role };
    res.status(200).json({ success: true, data: { user: userData, accessToken }, message: 'Logged in successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken: token } = req.cookies;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const tokenDoc = await RefreshToken.findOne({ token }).populate('user');
    
    if (!tokenDoc || tokenDoc.isRevoked || tokenDoc.expiresAt < new Date()) {
      if (tokenDoc) {
        tokenDoc.isRevoked = true;
        await tokenDoc.save();
      }
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = tokenDoc.user;
    if (user.isFrozen) {
      return res.status(403).json({ success: false, message: 'Account is frozen' });
    }

    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    const accessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user);
    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({ success: true, data: { accessToken }, message: 'Token refreshed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });
    }
    
    res.clearCookie('refreshToken');
    
    if (req.user) {
      await createAuditLog('user.logout', req.user._id, {}, req.ip, req.user._id);
    }
    
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const wallets = await Wallet.find({ user: user._id });
    
    res.status(200).json({ success: true, data: { user, wallets }, message: 'User fetched' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);
    
    await createAuditLog('user.login', user._id, { method: 'google' }, req.ip, user._id);
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/oauth-callback?token=${accessToken}`);
  } catch (error) {
    console.error(error);
    res.redirect('/login?error=oauth_failed');
  }
};

export const githubCallback = async (req, res) => {
  try {
    const user = req.user;
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    setRefreshTokenCookie(res, refreshToken);
    
    await createAuditLog('user.login', user._id, { method: 'github' }, req.ip, user._id);
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/oauth-callback?token=${accessToken}`);
  } catch (error) {
    console.error(error);
    res.redirect('/login?error=oauth_failed');
  }
};
