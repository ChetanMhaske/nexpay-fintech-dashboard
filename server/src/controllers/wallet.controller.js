import Wallet from '../models/Wallet.js';

export const getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({ user: req.user._id });
    res.status(200).json({ success: true, data: wallets, message: 'Wallets fetched successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getWalletById = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ _id: req.params.id, user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }
    res.status(200).json({ success: true, data: wallet, message: 'Wallet fetched successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
