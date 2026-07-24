import React, { useState, useEffect } from 'react';
import { Plus, Activity, CreditCard, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { walletService, transactionService } from '../services/api';
import Layout from '../components/Layout';
import BalanceCard from '../components/BalanceCard';
import StatCard from '../components/StatCard';
import TransactionTable from '../components/TransactionTable';
import TransactionModal from '../components/TransactionModal';
import Spinner from '../components/Spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 8900 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

const mockRates = { BTC: 43250.00, ETH: 2280.00, USD: 1 };

const Dashboard = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletsRes, txRes] = await Promise.all([
        walletService.getWallets().catch(() => ({ data: [] })),
        transactionService.getTransactions({ limit: 10 }).catch(() => ({ data: { transactions: [] } }))
      ]);
      const walletsData = walletsRes.data || walletsRes || [];
      const walletsArray = Array.isArray(walletsData) ? walletsData : (walletsData.wallets || []);
      setWallets(walletsArray.length ? walletsArray : [{ currency: 'USD', balance: 0 }, { currency: 'BTC', balance: 0 }, { currency: 'ETH', balance: 0 }]);
      const txData = txRes.data || txRes || {};
      setTransactions(txData.transactions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalVolume = transactions.reduce((acc, curr) => acc + (curr.amount * (mockRates[curr.currency] || 1)), 0);
  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  if (loading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name}</h1>
          <p className="text-dark-400 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Transaction
        </button>
      </div>

      {/* Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {['USD', 'BTC', 'ETH'].map(currency => {
          const wallet = wallets.find(w => w.currency === currency) || { balance: 0 };
          return (
            <BalanceCard 
              key={currency} 
              currency={currency} 
              balance={wallet.balance} 
              usdValue={wallet.balance * (mockRates[currency] || 1)} 
            />
          );
        })}
      </div>

      {/* Stats & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-dark-800 flex justify-between items-center">
            <h3 className="font-semibold text-white">Activity Overview</h3>
          </div>
          <div className="p-6 flex-1 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }} 
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          <StatCard icon={Activity} label="Total Transactions" value={transactions.length} />
          <StatCard icon={PieChart} label="Total Volume (USD)" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalVolume)} />
          <StatCard icon={CreditCard} label="Pending Operations" value={pendingCount} />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-dark-800 flex justify-between items-center">
          <h3 className="font-semibold text-white">Recent Transactions</h3>
        </div>
        <TransactionTable transactions={transactions} />
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </Layout>
  );
};

export default Dashboard;
