import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-red-700 mb-4">❌ Předplatné zrušeno</h1>
      <p className="mb-6">Transakce byla zrušena nebo nedokončena. Můžeš to zkusit znovu.</p>
      <button
        onClick={() => navigate('/subscribe')}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Zkusit znovu
      </button>
    </div>
  );
};

export default SubscriptionCancelled;
