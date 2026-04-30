'use client';

import { useState } from 'react';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [type, setType] = useState('A');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryDNS = async () => {
    if (!domain) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/dns?name=${encodeURIComponent(domain)}&type=${type}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to query DNS. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">🔍 PivotDNS</h1>
        <p className="text-center text-gray-400 mb-8">Private DNS over HTTPS Resolver</p>
        
        <div className="bg-gray-900 p-6 rounded-2xl shadow-xl">
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="google.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1 p-4 bg-black border border-gray-700 rounded-xl text-lg focus:outline-none focus:border-blue-600"
            />
            
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="p-4 bg-black border border-gray-700 rounded-xl focus:outline-none focus:border-blue-600"
            >
              <option value="A">A</option>
              <option value="AAAA">AAAA</option>
              <option value="MX">MX</option>
              <option value="TXT">TXT</option>
              <option value="NS">NS</option>
            </select>
          </div>

          <button 
            onClick={queryDNS}
            disabled={loading || !domain}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 p-4 rounded-xl font-semibold text-lg transition"
          >
            {loading ? 'Resolving...' : 'Resolve DNS'}
          </button>

          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

          {result && (
            <div className="mt-6">
              <p className="text-green-400 mb-2">✅ Resolved successfully</p>
              <pre className="bg-black p-5 rounded-xl overflow-auto text-sm border border-gray-800">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
