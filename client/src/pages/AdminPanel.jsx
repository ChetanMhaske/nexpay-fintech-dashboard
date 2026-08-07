import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { userService, transactionService } from '../services/api';
import Spinner from '../components/Spinner';
import TransactionTable from '../components/TransactionTable';
import { Search } from 'lucide-react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, txRes] = await Promise.all([
        userService.getUsers({ limit: 500 }).catch(() => ({ data: { users: [] } })),
        userService.getAllTransactions({ limit: 1000 }).catch(() => ({ data: { transactions: [] } }))
      ]);
      const usersData = usersRes.data || usersRes || {};
      const txData = txRes.data || txRes || {};
      setUsers(usersData.users || []);
      setTransactions(txData.transactions || []);
    } catch (error) {
      console.error('Admin data fetch error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await userService.updateRole(userId, role);
      setUsers(users.map(u => u._id === userId ? { ...u, role } : u));
    } catch (error) {
      alert('Failed to update role');
    }
  };

  const handleFreezeToggle = async (userId, isFrozen) => {
    try {
      await userService.freezeUser(userId, !isFrozen);
      setUsers(users.map(u => u._id === userId ? { ...u, isFrozen: !isFrozen } : u));
    } catch (error) {
      alert('Failed to freeze/unfreeze user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleReverse = async (txId) => {
    if (!window.confirm('Are you sure you want to reverse this transaction?')) return;
    try {
      console.log('Reversing transaction:', txId);
      await transactionService.reverseTransaction(txId);
      setTransactions(transactions.map(tx => (tx._id === txId || tx.id === txId) ? { ...tx, reversed: true } : tx));
    } catch (error) {
      console.error('Reverse error:', error.response?.status, error.response?.data);
      const msg = error.response?.data?.message || `Failed to reverse transaction (HTTP ${error.response?.status || 'unknown'})`;
      alert(msg);
    }
  };

  const handleResolve = async (txId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this transaction?`)) return;
    try {
      await transactionService.resolveTransaction(txId, action);
      setTransactions(transactions.map(tx => (tx._id === txId || tx.id === txId) ? { ...tx, status: action === 'approve' ? 'complete' : 'failed' } : tx));
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${action} transaction`);
    }
  };

  return (
    <Layout>
      <div className="mb-12 animate-in fade-in duration-500">
        <h1 className="text-3xl font-display font-medium text-white tracking-tight">Admin Panel</h1>
        <p className="text-dark-400 text-sm mt-1">Manage users and oversee global transactions.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden mb-12 animate-in fade-in duration-500 delay-100">
            <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-semibold text-white">User Management</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9 py-2 text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0A0A0B] z-10 shadow-sm">
                  <tr className="border-b border-white/10 text-dark-400 text-sm">
                    <th className="pb-3 font-medium px-6 pt-4">Name</th>
                    <th className="pb-3 font-medium px-6 pt-4">Email</th>
                    <th className="pb-3 font-medium px-6 pt-4">Role</th>
                    <th className="pb-3 font-medium px-6 pt-4">Status</th>
                    <th className="pb-3 font-medium px-6 pt-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-150 group">
                      <td className="py-4 px-6 text-white font-medium">{u.name}</td>
                      <td className="py-4 px-6 text-dark-300 font-mono text-xs">{u.email}</td>
                      <td className="py-4 px-6">
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="bg-dark-900 border border-white/10 text-white rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary-500 outline-none cursor-pointer"
                        >
                          <option value="user">User</option>
                          <option value="auditor">Auditor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        {u.isFrozen ? 
                          <div className="flex items-center gap-1.5"><span className="text-rose-500 text-[10px]">●</span><span className="text-dark-300">Frozen</span></div> : 
                          <div className="flex items-center gap-1.5"><span className="text-emerald-500 text-[10px]">●</span><span className="text-dark-300">Active</span></div>
                        }
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => handleFreezeToggle(u._id, u.isFrozen)}
                          className={`text-xs font-medium px-3 py-1 rounded transition-colors border ${
                            u.isFrozen ? 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10' : 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10'
                          }`}
                        >
                          {u.isFrozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-6 text-dark-400">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-0 overflow-hidden animate-in fade-in duration-500 delay-200">
            <div className="p-6 border-b border-white/10">
              <h3 className="font-semibold text-white">Global Transactions</h3>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              <TransactionTable transactions={transactions} showUser={true} showActions={true} onReverse={handleReverse} onResolve={handleResolve} />
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default AdminPanel;
