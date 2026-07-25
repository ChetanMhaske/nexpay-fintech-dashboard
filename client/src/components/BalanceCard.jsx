import React from 'react';

const icons = {
  USD: () => <span className="font-bold text-lg">$</span>,
  BTC: () => <span className="font-bold text-lg">₿</span>,
  ETH: () => <span className="font-bold text-lg">Ξ</span>,
};

const textColors = {
  USD: 'text-dark-100',
  BTC: 'text-dark-300',
  ETH: 'text-dark-300',
};

const BalanceCard = ({ currency, balance, usdValue }) => {
  const Icon = icons[currency] || icons.USD;
  const textClass = textColors[currency] || textColors.USD;

  const formatBalance = (val, curr) => {
    if (curr === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    if (curr === 'BTC') return Number(val).toFixed(8);
    if (curr === 'ETH') return Number(val).toFixed(4);
    return val;
  };

  return (
    <div className={`card relative overflow-hidden hover:bg-white/[0.02] transition-colors duration-200 group`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-dark-400 mb-2 uppercase tracking-wider text-xs">{currency} Wallet</p>
          <h3 className={`${currency === 'USD' ? 'text-4xl sm:text-5xl font-display' : 'text-2xl font-sans'} font-semibold text-dark-100 mb-1 tabular-nums tracking-tight`}>
            {formatBalance(balance, currency)} {currency !== 'USD' && <span className="text-sm font-medium text-dark-400">{currency}</span>}
          </h3>
          {currency !== 'USD' && (
            <p className="text-sm text-dark-400 tabular-nums">
              ≈ {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdValue)}
            </p>
          )}
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-[#0A0A0B] border border-white/5 opacity-50 group-hover:opacity-100 transition-opacity ${textClass}`}>
          <Icon />
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
