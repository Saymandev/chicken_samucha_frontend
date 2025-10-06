import { Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import EMAIL_TEMPLATES from '../../constants/emailTemplates';
import { campaignsAPI, subscriptionsAPI } from '../../utils/api';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduledFor?: string;
  sentAt?: string;
  stats?: { recipients: number; sent: number; failed: number };
  createdAt: string;
}

const AdminCampaigns: React.FC = () => {
  const [items, setItems] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateValues, setTemplateValues] = useState<Record<string,string>>({});
  const [showHtml, setShowHtml] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  const load = async () => {
    try {
      const res = await campaignsAPI.list();
      setItems(res.data?.data || []);
    } catch (e) {}
  };

  const loadSubscriberCount = async () => {
    try {
      const res = await subscriptionsAPI.list({ status: 'active' });
      const subscribers = res.data?.data || [];
      setSubscriberCount(subscribers.length);
    } catch (e) {
      console.error('Error loading subscribers:', e);
    }
  };

  useEffect(() => { 
    load();
    loadSubscriberCount();
  }, []);

  const handleCreate = async () => {
    if (!name || !subject || !html) {
      toast.error('Name, subject and content are required');
      return;
    }
    try {
      setLoading(true);
      // Convert local datetime-local to UTC ISO to avoid date rollovers
      const scheduledIso = scheduledFor
        ? new Date(scheduledFor).toISOString()
        : undefined;
      await campaignsAPI.create({ name: name || subject, subject, html, filters: {}, scheduledFor: scheduledIso });
      toast.success('Campaign created');
      setName(''); setSubject(''); setHtml(''); setScheduledFor(''); setTemplateId(''); setTemplateValues({});
      load();
    } catch (e) {} finally { setLoading(false); }
  };

  const handleSend = async (id: string) => {
    try {
      setLoading(true);
      await campaignsAPI.sendNow(id);
      toast.success('Sending started');
      load();
    } catch (e) {} finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Campaigns</h1>
        
        {/* Subscriber Count Badge */}
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active Subscribers</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{subscriberCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Create Campaign</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Will be sent to <span className="font-bold text-blue-600 dark:text-blue-400">{subscriberCount} subscribers</span>
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <select value={templateId} onChange={(e)=>{
            const id = e.target.value; setTemplateId(id);
            const t = EMAIL_TEMPLATES.find(x=>x.id===id);
            if (t) {
              setSubject(t.subject);
              const values = { ...t.defaults };
              setTemplateValues(values);
              setHtml(t.render(values));
              if (!name) setName(t.name);
            }
          }} className="px-3 py-2 rounded border dark:bg-gray-900 md:col-span-2">
            <option value="">Choose a template (optional)</option>
            {EMAIL_TEMPLATES.map(t=> (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {templateId && (
            <div className="md:col-span-2 grid md:grid-cols-2 gap-3">
              {(EMAIL_TEMPLATES.find(t=>t.id===templateId)?.fields || []).map(f => (
                <input key={f.key} value={templateValues[f.key] || ''}
                  onChange={(e)=>{
                    const v = { ...templateValues, [f.key]: e.target.value };
                    setTemplateValues(v);
                    const tmpl = EMAIL_TEMPLATES.find(t=>t.id===templateId)!;
                    setHtml(tmpl.render(v));
                  }}
                  placeholder={f.label}
                  className="px-3 py-2 rounded border dark:bg-gray-900" />
              ))}
            </div>
          )}
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" className="px-3 py-2 rounded border dark:bg-gray-900" />
          <input value={subject} onChange={(e)=>setSubject(e.target.value)} placeholder="Subject" className="px-3 py-2 rounded border dark:bg-gray-900" />
          <div className="md:col-span-2 grid gap-4">
            <div className="border rounded-lg p-3 dark:border-gray-700 bg-white text-black overflow-auto shadow-sm" dangerouslySetInnerHTML={{ __html: html }} />
            <button type="button" onClick={()=>setShowHtml(!showHtml)} className="text-sm text-gray-600 dark:text-gray-300 underline w-max">{showHtml ? 'Hide HTML' : 'Advanced: Edit HTML'}</button>
            {showHtml && (
              <textarea value={html} onChange={(e)=>setHtml(e.target.value)} placeholder="HTML (advanced)" className="px-3 py-2 rounded border dark:bg-gray-900 min-h-[220px] font-mono text-xs" />
            )}
          </div>
          <input type="datetime-local" value={scheduledFor} onChange={(e)=>setScheduledFor(e.target.value)} className="px-3 py-2 rounded border dark:bg-gray-900" placeholder="Schedule (optional)" />
          <div className="flex items-center">
            <button onClick={handleCreate} disabled={loading} className="btn-primary">Save Campaign</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent/Failed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.length > 0 ? items.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{c.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{c.subject}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    c.status === 'sent' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                    c.status === 'sending' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                    c.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                    c.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {c.scheduledFor ? new Date(c.scheduledFor).toLocaleString() : '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {c.stats?.recipients || 0}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {c.stats ? (
                    <div className="space-y-1">
                      <div className="text-green-600 dark:text-green-400">✓ Sent: {c.stats.sent}</div>
                      {c.stats.failed > 0 && (
                        <div className="text-red-600 dark:text-red-400">✗ Failed: {c.stats.failed}</div>
                      )}
                    </div>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-right space-x-4">
                  <button onClick={()=>handleSend(c.id)} className="text-primary-600 hover:underline">Send now</button>
                  <button onClick={async()=>{ try { await campaignsAPI.delete(c.id); toast.success('Deleted'); load(); } catch(e){} }} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No campaigns yet. Create your first campaign above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCampaigns;


