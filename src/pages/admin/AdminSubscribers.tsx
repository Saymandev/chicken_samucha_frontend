import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { subscriptionsAPI } from '../../utils/api';

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  source?: string;
  createdAt: string;
  unsubscribedAt?: string | null;
}

const AdminSubscribers: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [status, setStatus] = useState<'active'|'unsubscribed'|'all'>('active');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (status !== 'all') params.status = status;
      const res = await subscriptionsAPI.list(params);
      setSubscribers(res.data?.data || []);
    } catch (e) {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const handleUnsubscribe = async (email: string) => {
    try {
      await subscriptionsAPI.unsubscribe(email);
      toast.success('Unsubscribed');
      load();
    } catch (e) {}
  };

  const handleBroadcast = async () => {
    if (!subject || !message) {
      toast.error('Subject and message required');
      return;
    }
    try {
      setLoading(true);
      const res = await subscriptionsAPI.broadcast({ subject, html: `<p>${message}</p>` });
      toast.success(`Sent: ${res.data?.sent || 0}`);
      setSubject(''); setMessage('');
    } catch (e) {} finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Subscribers</h1>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e)=>setStatus(e.target.value as any)} className="px-3 py-2 rounded border dark:bg-gray-800">
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="all">All</option>
          </select>
          <button onClick={load} className="btn-primary px-4 py-2">Refresh</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold mb-3 text-gray-900 dark:text-white">Quick Broadcast</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Subject" className="px-3 py-2 rounded border dark:bg-gray-900 md:col-span-1" />
          <input value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Message (HTML supported)" className="px-3 py-2 rounded border dark:bg-gray-900 md:col-span-2" />
          <button onClick={handleBroadcast} disabled={loading} className="btn-primary">Send</button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {subscribers.map(s => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{s.email}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{s.name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{s.source || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">
                  {s.unsubscribedAt ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700">Unsubscribed</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-200 text-green-800 dark:bg-green-900/40 dark:text-green-300">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!s.unsubscribedAt && (
                    <button onClick={()=>handleUnsubscribe(s.email)} className="text-red-600 hover:underline">Unsubscribe</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSubscribers;


