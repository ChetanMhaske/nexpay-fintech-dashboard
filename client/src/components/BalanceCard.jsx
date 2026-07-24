import React from 'react';

const icons = {
  USD: () => <span className="font-bold text-lg">$</span>,
  BTC: () => <span className="font-bold text-lg">₿</span>,
  ETH: () => <span className="font-bold text-lg">Ξ</span>,
};

const bgColors = {
  USD: 'bg-primary-900/20 border-primary-800/50',
  BTC: 'bg-orange-900/20 border-orange-800/50',
  ETH: 'bg-indigo-900/20 border-indigo-800/50',
};

const textColors = {
  USD: 'text-primary-400',
  BTC: 'text-orange-400',
  ETH: 'text-indigo-400',
};

const BalanceCard = ({ currency, balance, usdValue }) => {
  const Icon = icons[currency] || icons.USD;
  const bgClass = bgColors[currency] || bgColors.USD;
  const textClass = textColors[currency] || textColors.USD;

  const formatBalance = (val, curr) => {
    if (curr === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    if (curr === 'BTC') return Number(val).toFixed(8);
    if (curr === 'ETH') return Number(val).toFixed(4);
    return val;
  };

  return (
    <div className={`card ${bgClass} relative overflow-hidden`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-dark-400 mb-1">{currency} Wallet</p>
          <h3 className="text-2xl font-bold text-dark-100 mb-1">
            {formatBalance(balance, currency)} {currency !== 'USD' && <span className="text-sm font-medium text-dark-400">{currency}</span>}
          </h3>
          {currency !== 'USD' && (
            <p className="text-sm text-dark-400">
              ≈ {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdValue)}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-dark-800 ${textClass}`}>
          <Icon />
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
