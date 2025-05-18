import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

interface SecurityScanResult {
  sslLabs: any;
  securityHeaders: any;
  dns: {
    spf: string | null;
    dkim: string | null;
    dmarc: string | null;
    dnssec: boolean;
  };
  errors?: string[];
}

interface SecurityScanHistoryItem {
  domain: string;
  timestamp: string;
  result: SecurityScanResult;
}

export default function SiteSecurityScan() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SecurityScanResult | null>(null);
  const [history, setHistory] = useState<SecurityScanHistoryItem[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('siteSecurityScanHistory');
    if (stored) setHistory(JSON.parse(stored));
  }, []);
  useEffect(() => {
    localStorage.setItem('siteSecurityScanHistory', JSON.stringify(history));
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/site-security-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, debug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to perform security scan');
      setResult(data);
      const newItem: SecurityScanHistoryItem = {
        domain,
        timestamp: new Date().toLocaleString(),
        result: data,
      };
      setHistory([newItem, ...history].slice(0, 10));
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      if (err.response && err.response.data && err.response.data.details) {
        setResult({
          sslLabs: null,
          securityHeaders: null,
          dns: { spf: null, dkim: null, dmarc: null, dnssec: false },
          errors: err.response.data.details,
        } as any);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('siteSecurityScanHistory');
  };

  return (
    <Layout>
      <Head>
        <title>Website Security Scanner - BreachSignal OSINT Toolbox</title>
        <meta name="description" content="Scan your website for HTTPS, security headers, and DNS configuration." />
      </Head>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Website Security Scanner</h1>
        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={debug} onChange={() => setDebug(!debug)} />
            Debug mode
          </label>
        </div>
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
              {loading ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </form>
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-100">
            {error}
            {result && (result as any).errors && debug && (
              <pre className="mt-2 bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto text-xs text-red-700 dark:text-red-300">
                {JSON.stringify((result as any).errors, null, 2)}
              </pre>
            )}
          </div>
        )}
        {result && (result.sslLabs || result.securityHeaders || result.dns) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {result.errors && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded dark:bg-yellow-900 dark:text-yellow-200">
                Some parts of the scan failed. See below for details. Enable debug mode for more info.
              </div>
            )}
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Security Report for {domain}
            </h2>
            {result.sslLabs && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300 mb-2">SSL Labs</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto text-xs">
                  {JSON.stringify(result.sslLabs, null, 2)}
                </pre>
              </div>
            )}
            {result.securityHeaders && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300 mb-2">Security Headers</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto text-xs">
                  {JSON.stringify(result.securityHeaders, null, 2)}
                </pre>
              </div>
            )}
            {result.dns && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300 mb-2">DNS Configuration</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">SPF</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{result.dns.spf || 'Not found'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">DKIM</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{result.dns.dkim || 'Not found'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">DMARC</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{result.dns.dmarc || 'Not found'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">DNSSEC</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{result.dns.dnssec ? 'Enabled' : 'Not enabled'}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}
        {/* History Section */}
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
                      <div className="mb-2">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300">SSL Labs</h4>
                        <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto text-xs">
                          {JSON.stringify(item.result.sslLabs, null, 2)}
                        </pre>
                      </div>
                      <div className="mb-2">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300">Security Headers</h4>
                        <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto text-xs">
                          {JSON.stringify(item.result.securityHeaders, null, 2)}
                        </pre>
                      </div>
                      <div className="mb-2">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300">DNS Configuration</h4>
                        <dl className="space-y-1">
                          <div>
                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">SPF</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">{item.result.dns.spf || 'Not found'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">DKIM</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">{item.result.dns.dkim || 'Not found'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">DMARC</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">{item.result.dns.dmarc || 'Not found'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">DNSSEC</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">{item.result.dns.dnssec ? 'Enabled' : 'Not enabled'}</dd>
                          </div>
                        </dl>
                      </div>
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