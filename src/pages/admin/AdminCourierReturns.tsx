import { motion } from 'framer-motion';
import React from 'react';
import { adminAPI } from '../../utils/api';

const badge = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-blue-100 text-blue-800';
    case 'processing': return 'bg-purple-100 text-purple-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const AdminCourierReturns: React.FC = () => {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await adminAPI.steadfastGetReturns();
        const list = r.data?.data || r.data?.returns || [];
        setItems(Array.isArray(list) ? list : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Courier Return Requests</h1>
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No return requests found.</p>
        ) : (
          <div className="space-y-3">
            {items.map((ret: any) => (
              <motion.div key={ret.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-gray-900 dark:text-white font-semibold">Return #{ret.id}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Consignment: {ret.consignment_id || 'N/A'} | Invoice: {ret.invoice || 'N/A'} | Tracking: {ret.tracking_code || 'N/A'}</div>
                    {ret.reason && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">Reason: {ret.reason}</div>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${badge(ret.status)}`}>{ret.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourierReturns;


