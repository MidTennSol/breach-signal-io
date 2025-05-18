import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

interface WhoisData {
  registrar: string;
  createdDate: string;
  expiresDate: string;
  updatedDate: string;
  nameServers: string[];
  status: string;
  rawData: string;
}

interface WhoisHistoryItem {
  domain: string;
  timestamp: string;
  result: WhoisData;
}

export default function WhoisLookup() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whoisData, setWhoisData] = useState<WhoisData | null>(null);
  const [history, setHistory] = useState<WhoisHistoryItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const router = useRouter();

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('whoisHistory');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('whoisHistory', JSON.stringify(history));
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWhoisData(null);

    try {
      const response = await fetch('/api/whois-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch WHOIS data');
      }

      setWhoisData(data);
      // Add to history
      const newItem: WhoisHistoryItem = {
        domain,
        timestamp: new Date().toLocaleString(),
        result: data,
      };
      setHistory([newItem, ...history].slice(0, 10)); // Keep last 10
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('whoisHistory');
  };

  return (
    <Layout>
      <Head>
        <title>WHOIS Lookup - BreachSignal OSINT Toolbox</title>
        <meta name="description" content="Look up domain registration information using our WHOIS lookup tool" />
      </Head>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          WHOIS Lookup
        </h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter domain (e.g., example.com)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Looking up...' : 'Look Up'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-100">
            {error}
          </div>
        )}

        {whoisData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              WHOIS Results for {domain}
            </h2>
            
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Registrar</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{whoisData.registrar}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{whoisData.createdDate}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires Date</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{whoisData.expiresDate}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated Date</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{whoisData.updatedDate}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name Servers</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {whoisData.nameServers.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {whoisData.nameServers.map((ns, index) => (
                        <li key={index}>{ns}</li>
                      ))}
                    </ul>
                  ) : (
                    'No name servers found'
                  )}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{whoisData.status}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* WHOIS Lookup History */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lookup History</h2>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-sm text-red-600 hover:underline"
              >
                Clear History
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">No lookups yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((item, idx) => (
                <li key={idx} className="py-2">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => handleExpand(idx)}>
                    <span className="font-mono text-blue-700 dark:text-blue-300">{item.domain}</span>
                    <span className="text-xs text-gray-500 ml-2">{item.timestamp}</span>
                    <button className="ml-4 text-blue-600 hover:underline text-xs">
                      {expandedIndex === idx ? 'Hide' : 'Expand'}
                    </button>
                  </div>
                  {expandedIndex === idx && (
                    <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-4">
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Registrar</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.registrar}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Created Date</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.createdDate}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Expires Date</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.expiresDate}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Updated Date</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.updatedDate}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Name Servers</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">
                            {item.result.nameServers.length > 0 ? (
                              <ul className="list-disc list-inside">
                                {item.result.nameServers.map((ns, i) => (
                                  <li key={i}>{ns}</li>
                                ))}
                              </ul>
                            ) : (
                              'No name servers found'
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.status}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
} 