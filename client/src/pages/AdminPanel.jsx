import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { userService } from '../services/api';
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
        userService.getUsers().catch(() => ({ data: { users: [] } })),
        userService.getAllTransactions({ limit: 10 }).catch(() => ({ data: { transactions: [] } }))
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

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-dark-400 text-sm mt-1">Manage users and oversee global transactions.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden mb-8">
            <div className="p-6 border-b border-dark-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dark-800 text-dark-400 text-sm">
                    <th className="pb-3 font-medium px-6 pt-4">Name</th>
                    <th className="pb-3 font-medium px-6 pt-4">Email</th>
                    <th className="pb-3 font-medium px-6 pt-4">Role</th>
                    <th className="pb-3 font-medium px-6 pt-4">Status</th>
                    <th className="pb-3 font-medium px-6 pt-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                      <td className="py-4 px-6 text-white font-medium">{u.name}</td>
                      <td className="py-4 px-6 text-dark-300">{u.email}</td>
                      <td className="py-4 px-6">
                        <select 
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="bg-dark-800 border border-dark-700 text-white rounded px-2 py-1 text-xs focus:ring-primary-500"
                        >
                          <option value="user">User</option>
                          <option value="auditor">Auditor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        {u.isFrozen ? 
                          <span className="badge bg-danger-500/10 text-danger-500 border border-danger-500/20">Frozen</span> : 
                          <span className="badge bg-success-500/10 text-success-500 border border-success-500/20">Active</span>
                        }
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => handleFreezeToggle(u._id, u.isFrozen)}
                          className={`text-xs font-medium px-3 py-1 rounded transition-colors ${
                            u.isFrozen ? 'bg-success-500/10 text-success-500 hover:bg-success-500/20' : 'bg-warning-500/10 text-warning-500 hover:bg-warning-500/20'
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

          <div className="card p-0 overflow-hidden">
            <div className="p-6 border-b border-dark-800">
              <h3 className="font-semibold text-white">Global Transactions</h3>
            </div>
            <TransactionTable transactions={transactions} showUser={true} />
          </div>
        </>
      )}
    </Layout>
  );
};

export default AdminPanel;
