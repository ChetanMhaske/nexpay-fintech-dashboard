import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';

dotenv.config();

const createDefaultWallets = async (userId) => {
  await Wallet.insertMany([
    { user: userId, currency: 'USD', balance: 1000 },
    { user: userId, currency: 'BTC', balance: 0.5 },
    { user: userId, currency: 'ETH', balance: 2.0 }
  ]);
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_client_secret',
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
          await user.save();
        } else {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            role: 'user',
            avatar: profile.photos[0]?.value
          });
          await createDefaultWallets(user._id);
        }
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_client_secret',
    callbackURL: '/api/auth/github/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });
      
      if (!user) {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.com`;
        user = await User.findOne({ email });
        if (user) {
          user.githubId = profile.id;
          await user.save();
        } else {
          user = await User.create({
            name: profile.displayName || profile.username,
            email: email,
            githubId: profile.id,
            role: 'user',
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null
          });
          await createDefaultWallets(user._id);
        }
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
