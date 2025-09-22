import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import EMAIL_TEMPLATES from '../../constants/emailTemplates';
import { campaignsAPI } from '../../utils/api';

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

  const load = async () => {
    try {
      const res = await campaignsAPI.list();
      setItems(res.data?.data || []);
    } catch (e) {}
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name || !subject || !html) {
      toast.error('Name, subject and content are required');
      return;
    }
    try {
      setLoading(true);
      await campaignsAPI.create({ name: name || subject, subject, html, filters: {}, scheduledFor: scheduledFor || undefined });
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
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Campaigns</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-8">
        <h2 className="font-semibold mb-3 text-gray-900 dark:text-white">Create Campaign</h2>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{c.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{c.subject}</td>
                <td className="px-4 py-3 text-sm">{c.status}</td>
                <td className="px-4 py-3 text-sm">{c.scheduledFor ? new Date(c.scheduledFor).toLocaleString() : '-'}</td>
                <td className="px-4 py-3 text-sm">
                  {c.stats ? `${c.stats.sent}/${c.stats.recipients} (failed ${c.stats.failed})` : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={()=>handleSend(c.id)} className="text-primary-600 hover:underline">Send now</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCampaigns;


