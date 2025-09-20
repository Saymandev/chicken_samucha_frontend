import React from 'react';
import RefundHistory from '../components/refund/RefundHistory';

const RefundHistoryPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <RefundHistory />
      </div>
    </div>
  );
};

export default RefundHistoryPage;
