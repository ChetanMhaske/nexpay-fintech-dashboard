import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, RefreshCw, DollarSign, Inbox } from 'lucide-react';

const TransactionTable = ({ transactions, showUser = false, showActions = false, onReverse, onResolve }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-4 h-4 text-success-500" />;
      case 'withdraw': return <ArrowUpRight className="w-4 h-4 text-danger-500" />;
      case 'transfer': return <ArrowRightLeft className="w-4 h-4 text-primary-500" />;
      case 'crypto_buy':
      case 'crypto_sell': return <RefreshCw className="w-4 h-4 text-warning-500" />;
      default: return <DollarSign className="w-4 h-4 text-dark-400" />;
    }
  };

  const getStatusBadge = (tx) => {
    if (tx.reversed) {
      return <div className="flex items-center gap-1.5"><span className="text-dark-500 text-[10px]">●</span><span className="text-dark-400 line-through">Reversed</span></div>;
    }
    switch (tx.status) {
      case 'completed': 
      case 'complete': return <div className="flex items-center gap-1.5"><span className="text-emerald-500 text-[10px]">●</span><span className="text-dark-300">Completed</span></div>;
      case 'pending': return <div className="flex items-center gap-1.5"><span className="text-amber-500 text-[10px]">●</span><span className="text-dark-300">Pending</span></div>;
      case 'failed': return <div className="flex items-center gap-1.5"><span className="text-rose-500 text-[10px]">●</span><span className="text-dark-300">Failed</span></div>;
      default: return <div className="flex items-center gap-1.5"><span className="text-dark-500 text-[10px]">●</span><span className="text-dark-300 capitalize">{tx.status}</span></div>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-3">
          <Inbox className="w-4 h-4 text-dark-500" />
        </div>
        <p className="text-dark-300 text-sm font-medium">No transactions yet</p>
        <p className="text-dark-500 text-xs mt-1">Deposits, transfers, and crypto trades will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-[#0A0A0B] z-10 shadow-sm">
          <tr className="border-b border-white/10 text-dark-400 text-sm">
            <th className="pb-3 font-medium px-4 pt-4">Type</th>
            {showUser && <th className="pb-3 font-medium px-4 pt-4">User</th>}
            <th className="pb-3 font-medium px-4 pt-4 text-right">Amount</th>
            <th className="pb-3 font-medium px-4 pt-4">Status</th>
            <th className="pb-3 font-medium px-4 pt-4">Date</th>
            <th className="pb-3 font-medium px-4 pt-4">Description</th>
            {showActions && <th className="pb-3 font-medium px-4 pt-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="text-sm">
          {transactions.map((tx) => (
            <tr key={tx.id || tx._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-150 group">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0A0A0B] border border-white/5 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                    {getIcon(tx.type)}
                  </div>
                  <span className="font-medium text-dark-100 capitalize">{tx.type.replace('_', ' ')}</span>
                </div>
              </td>
              {showUser && (
                <td className="py-4 px-4 text-dark-300">
                  {tx.userId?.email || 'N/A'}
                </td>
              )}
              <td className="py-4 px-4 font-mono font-medium text-dark-100 text-right tabular-nums tracking-tight">
                {tx.type === 'withdraw' || tx.type === 'crypto_buy' ? '-' : '+'}{tx.amount} {tx.currency}
              </td>
              <td className="py-4 px-4">
                {getStatusBadge(tx)}
              </td>
              <td className="py-4 px-4 text-dark-400">
                {formatDate(tx.createdAt)}
              </td>
              <td className="py-4 px-4 text-dark-400 max-w-xs truncate" title={tx.description}>
                <div>{tx.description || '-'}</div>
                {tx.metadata?.destinationAddress && (
                  <div className="text-xs text-dark-500 font-mono mt-1" title={tx.metadata.destinationAddress}>
                    To: {tx.metadata.destinationAddress.slice(0, 16)}...
                  </div>
                )}
              </td>
              {showActions && (
                <td className="py-4 px-4 text-right space-x-2">
                  {tx.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onResolve && onResolve(tx._id || tx.id, 'approve')}
                        className="text-xs font-medium px-3 py-1 rounded transition-colors border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onResolve && onResolve(tx._id || tx.id, 'reject')}
                        className="text-xs font-medium px-3 py-1 rounded transition-colors border border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {!tx.reversed && (tx.status === 'complete' || tx.status === 'completed') && (
                    <button
                      onClick={() => onReverse && onReverse(tx._id || tx.id)}
                      className="text-xs font-medium px-3 py-1 rounded transition-colors border border-white/10 text-dark-300 hover:bg-white/5 hover:text-white"
                    >
                      Reverse
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;