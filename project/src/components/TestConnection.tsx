import React, { useEffect, useState } from 'react';
import { testConnection } from '../Services/supabaseService';

const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await testConnection();
        setStatus(result.success ? 'success' : 'error');
        setMessage(result.success ? result.message ?? 'Unknown message' : result.error ?? 'Unknown error');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to connect');
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      <div className={`p-4 rounded ${
        status === 'loading' ? 'bg-yellow-100' :
        status === 'success' ? 'bg-green-100' : 'bg-red-100'
      }`}>
        <p className="font-medium">
          Status: {status === 'loading' ? 'Checking connection...' :
                 status === 'success' ? 'Connected' : 'Error'}
        </p>
        {message && <p className="mt-2">{message}</p>}
      </div>
    </div>
  );
};

export default TestConnection; 