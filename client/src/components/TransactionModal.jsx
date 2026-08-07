import React, { useState } from 'react';
import { X } from 'lucide-react';
import { transactionService } from '../services/api';
import Spinner from './Spinner';

const TransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { type, amount: Number(amount), currency };
      if (type === 'transfer') {
        payload.recipientEmail = recipientEmail;
      }
      if (type === 'withdraw' && destinationAddress.trim() !== '') {
        payload.destinationAddress = destinationAddress;
      }
      
      const idempotencyKey = crypto.randomUUID();
      await transactionService.createTransaction(payload, { 
        headers: { 'Idempotency-Key': idempotencyKey } 
      });
      onSuccess();
      onClose();
      // Reset form
      setAmount('');
      setRecipientEmail('');
      setDestinationAddress('');
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'deposit', label: 'Deposit' },
    { id: 'withdraw', label: 'Withdraw' },
    { id: 'transfer', label: 'Transfer' },
    { id: 'crypto_buy', label: 'Buy Crypto' },
    { id: 'crypto_sell', label: 'Sell Crypto' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#0A0A0B] border border-white/10 rounded-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-display font-medium text-white tracking-tight">New Transaction</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-danger-500/10 border border-danger-500/20 text-danger-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex overflow-x-auto space-x-2 mb-6 pb-2 hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { 
                  setType(tab.id); 
                  setError(''); 
                  if ((tab.id === 'crypto_buy' || tab.id === 'crypto_sell') && currency === 'USD') {
                    setCurrency('BTC');
                  } else if (tab.id === 'transfer' && currency !== 'USD') {
                    setCurrency('USD');
                  }
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  type === tab.id ? 'bg-primary-700 text-white' : 'bg-white/5 text-dark-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Currency</label>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field"
              >
                {(type === 'crypto_buy' || type === 'crypto_sell') ? (
                  <>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                  </>
                ) : (
                  <>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-4"
                  placeholder="0.00"
                />
              </div>
            </div>

            {type === 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Recipient Email</label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="input-field"
                  placeholder="user@example.com"
                />
              </div>
            )}

            {type === 'withdraw' && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Destination Address / Bank Account</label>
                <input
                  type="text"
                  required
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="input-field"
                  placeholder="e.g. bc1qxy2kgdygjrsqtzq2n0yrf249..."
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !amount || (type === 'transfer' && !recipientEmail) || (type === 'withdraw' && !destinationAddress)}
              className="btn-primary w-full mt-6 flex justify-center items-center"
            >
              {loading ? <Spinner size="sm" /> : 'Submit Transaction'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;