import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

interface IpReputationResult {
  abuseConfidenceScore: number;
  lastReportedAt: string;
  totalReports: number;
  countryCode: string;
  isp: string;
  domain: string;
  usageType: string;
  hostnames: string[];
}

interface IpReputationHistoryItem {
  ip: string;
  timestamp: string;
  result: IpReputationResult;
}

export default function IpReputationChecker() {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IpReputationResult | null>(null);
  const [history, setHistory] = useState<IpReputationHistoryItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ipReputationHistory');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ipReputationHistory', JSON.stringify(history));
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/ip-reputation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch IP reputation');
      setResult(data);
      // Add to history
      const newItem: IpReputationHistoryItem = {
        ip,
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
    localStorage.removeItem('ipReputationHistory');
  };

  return (
    <Layout>
      <Head>
        <title>IP Reputation Checker - BreachSignal OSINT Toolbox</title>
        <meta name="description" content="Check the reputation of any IP address using AbuseIPDB." />
      </Head>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">IP Reputation Checker</h1>
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="Enter IP address (e.g., 8.8.8.8)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
        </form>
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-100">
            {error}
          </div>
        )}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Reputation Results for {ip}
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Abuse Confidence Score</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{result.abuseConfidenceScore}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Reported At</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{result.lastReportedAt || 'Never'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Reports</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{result.totalReports}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{result.countryCode}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">ISP</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{result.isp}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Domain</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{result.domain}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Usage Type</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{result.usageType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Hostnames</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {result.hostnames && result.hostnames.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {result.hostnames.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  ) : (
                    'None'
                  )}
                </dd>
              </div>
            </dl>
          </div>
        )}
        {/* IP Reputation Lookup History */}
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
                    <span className="font-mono text-blue-700 dark:text-blue-300">{item.ip}</span>
                    <span className="text-xs text-gray-500 ml-2">{item.timestamp}</span>
                    <button className="ml-4 text-blue-600 hover:underline text-xs">
                      {expandedIndex === idx ? 'Hide' : 'Expand'}
                    </button>
                  </div>
                  {expandedIndex === idx && (
                    <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-4">
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Abuse Confidence Score</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.abuseConfidenceScore}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Reported At</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.lastReportedAt || 'Never'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Reports</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.totalReports}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Country</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.countryCode}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">ISP</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.isp}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Domain</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.domain}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Usage Type</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">{item.result.usageType}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Hostnames</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">
                            {item.result.hostnames && item.result.hostnames.length > 0 ? (
                              <ul className="list-disc list-inside">
                                {item.result.hostnames.map((h, i) => (
                                  <li key={i}>{h}</li>
                                ))}
                              </ul>
                            ) : (
                              'None'
                            )}
                          </dd>
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