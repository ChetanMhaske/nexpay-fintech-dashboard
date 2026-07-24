import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, RefreshCw, DollarSign } from 'lucide-react';

const TransactionTable = ({ transactions, showUser = false }) => {
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="badge bg-success-500/10 text-success-500 border border-success-500/20">Completed</span>;
      case 'pending': return <span className="badge bg-warning-500/10 text-warning-500 border border-warning-500/20">Pending</span>;
      case 'failed': return <span className="badge bg-danger-500/10 text-danger-500 border border-danger-500/20">Failed</span>;
      default: return <span className="badge bg-dark-500/10 text-dark-400 border border-dark-500/20">{status}</span>;
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
      <div className="text-center py-8 text-dark-400">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-dark-800 text-dark-400 text-sm">
            <th className="pb-3 font-medium px-4">Type</th>
            {showUser && <th className="pb-3 font-medium px-4">User</th>}
            <th className="pb-3 font-medium px-4">Amount</th>
            <th className="pb-3 font-medium px-4">Status</th>
            <th className="pb-3 font-medium px-4">Date</th>
            <th className="pb-3 font-medium px-4">Description</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {transactions.map((tx) => (
            <tr key={tx.id || tx._id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center">
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
              <td className="py-4 px-4 font-mono font-medium text-dark-100">
                {tx.type === 'withdraw' || tx.type === 'crypto_buy' ? '-' : '+'}{tx.amount} {tx.currency}
              </td>
              <td className="py-4 px-4">
                {getStatusBadge(tx.status)}
              </td>
              <td className="py-4 px-4 text-dark-400">
                {formatDate(tx.createdAt)}
              </td>
              <td className="py-4 px-4 text-dark-400 max-w-xs truncate" title={tx.description}>
                {tx.description || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
