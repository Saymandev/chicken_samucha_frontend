import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import EMAIL_TEMPLATES from '../../constants/emailTemplates';
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
  const [templateId, setTemplateId] = useState('');
  const [templateValues, setTemplateValues] = useState<Record<string,string>>({});
  const [showHtml, setShowHtml] = useState(false);

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
      const res = await subscriptionsAPI.broadcast({ subject, html: message.startsWith('<') ? message : `<p>${message}</p>` });
      toast.success(`Sent: ${res.data?.sent || 0}`);
      setSubject(''); setMessage(''); setTemplateId(''); setTemplateValues({});
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
        <div className="grid md:grid-cols-4 gap-3 items-start">
          <select value={templateId} onChange={(e)=>{
            const id = e.target.value; setTemplateId(id);
            const t = EMAIL_TEMPLATES.find(x=>x.id===id);
            if (t) {
              setSubject(t.subject);
              const values = { ...t.defaults };
              setTemplateValues(values);
              setMessage(t.render(values));
            }
          }} className="px-3 py-2 rounded border dark:bg-gray-900">
            <option value="">Template (optional)</option>
            {EMAIL_TEMPLATES.map(t=> (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {templateId && (
            <div className="md:col-span-3 grid md:grid-cols-3 gap-3">
              {(EMAIL_TEMPLATES.find(t=>t.id===templateId)?.fields || []).map(f => (
                <input key={f.key} value={templateValues[f.key] || ''}
                  onChange={(e)=>{
                    const v = { ...templateValues, [f.key]: e.target.value };
                    setTemplateValues(v);
                    const tmpl = EMAIL_TEMPLATES.find(t=>t.id===templateId)!;
                    setMessage(tmpl.render(v));
                  }}
                  placeholder={f.label}
                  className="px-3 py-2 rounded border dark:bg-gray-900" />
              ))}
            </div>
          )}
          <input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Subject" className="px-3 py-2 rounded border dark:bg-gray-900" />
          <div className="md:col-span-2 grid gap-3 items-start">
            <div className="border rounded-lg p-3 dark:border-gray-700 bg-white text-black overflow-auto shadow-sm" dangerouslySetInnerHTML={{ __html: message }} />
            <button type="button" onClick={()=>setShowHtml(!showHtml)} className="text-sm text-gray-600 dark:text-gray-300 underline w-max">{showHtml ? 'Hide HTML' : 'Advanced: Edit HTML'}</button>
            {showHtml && (
              <textarea value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="HTML (advanced)" className="px-3 py-2 rounded border dark:bg-gray-900 min-h-[180px] font-mono text-xs" />
            )}
          </div>
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


