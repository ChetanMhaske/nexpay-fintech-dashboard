import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auditService } from '../services/api';
import Spinner from '../components/Spinner';
import { Clock } from 'lucide-react';

const AuditView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        // Fallback to empty if api fails for dummy data setup
        const response = await auditService.getAuditLogs().catch(() => ({ data: { logs: [] } }));
        const logsData = response.data || response || {};
        setLogs(logsData.logs || []);
      } catch (error) {
        console.error('Error fetching audit logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="mb-12 animate-in fade-in duration-500">
        <h1 className="text-3xl font-display font-medium text-white tracking-tight">Audit Log</h1>
        <p className="text-dark-400 text-sm mt-1">System-wide action tracking for compliance and security.</p>
      </div>

      <div className="card p-0 overflow-hidden animate-in fade-in duration-500 delay-100">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" />
            Recent Activity
          </h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-dark-400 text-sm">
                  <th className="pb-3 font-medium px-6 pt-4">Action</th>
                  <th className="pb-3 font-medium px-6 pt-4">Performed By</th>
                  <th className="pb-3 font-medium px-6 pt-4">Target User</th>
                  <th className="pb-3 font-medium px-6 pt-4">Details</th>
                  <th className="pb-3 font-medium px-6 pt-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.map(log => (
                  <tr key={log._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-150 group">
                    <td className="py-4 px-6">
                      <span className="badge bg-white/5 text-dark-300 border border-white/10 font-mono text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-dark-300 font-mono text-xs">{log.performedBy?.email || 'System'}</td>
                    <td className="py-4 px-6 text-dark-300 font-mono text-xs">{log.targetUser?.email || '-'}</td>
                    <td className="py-4 px-6 text-dark-400 max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-4 px-6 text-dark-400 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-8 text-dark-400">No audit logs available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AuditView;
