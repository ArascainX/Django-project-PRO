import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-green-700 mb-4">✅ Děkujeme za předplatné!</h1>
      <p className="mb-6">Předplatné bylo úspěšně aktivováno. Užij si všechny výhody.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Pokračovat do aplikace
      </button>
    </div>
  );
};

export default SubscriptionSuccess;
