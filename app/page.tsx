'use client';

import { useState } from 'react';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [type, setType] = useState('A');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const queryDNS = async () => {
    if (!domain) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dns-query?name=${domain}&type=${type}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Error querying DNS');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">DNS over HTTPS Resolver</h1>
        
        <div className="bg-gray-900 p-6 rounded-xl">
          <input
            type="text"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full p-3 bg-black rounded-lg mb-4 text-lg"
          />
          
          <div className="flex gap-4 mb-6">
            <select value={type} onChange={(e) => setType(e.target.value)} className="bg-black p-3 rounded-lg">
              <option value="A">A</option>
              <option value="AAAA">AAAA</option>
              <option value="MX">MX</option>
              <option value="TXT">TXT</option>
              <option value="NS">NS</option>
            </select>
            
            <button 
              onClick={queryDNS}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Resolving...' : 'Resolve'}
            </button>
          </div>

          {result && (
            <pre className="bg-black p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
