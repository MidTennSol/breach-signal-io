import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';

interface UnifiedScanResult {
  hibp?: any;
  whois?: any;
  ipReputation?: any;
  siteSecurity?: any;
  errors?: Record<string, any>;
}

interface UnifiedScanHistoryItem {
  email?: string;
  domain?: string;
  ip?: string;
  timestamp: string;
  result: UnifiedScanResult;
}

const ReCAPTCHA = dynamic(() => import('react-google-recaptcha'), { ssr: false }) as typeof import('react-google-recaptcha');

function isValidIP(input: string) {
  // Simple IPv4/IPv6 regex
  return /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(input) || /:/g.test(input);
}
function isValidDomain(input: string) {
  // Simple domain regex
  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input);
}

export default function OsintTools() {
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UnifiedScanResult | null>(null);
  const [history, setHistory] = useState<UnifiedScanHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'whois' | 'ip' | 'site'>('all');
  const [debug, setDebug] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('unifiedOsintHistory');
    if (stored) setHistory(JSON.parse(stored));
  }, []);
  useEffect(() => {
    localStorage.setItem('unifiedOsintHistory', JSON.stringify(history));
  }, [history]);

  const handleScanAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const tasks: Promise<any>[] = [];
    let hibpRes = null, whoisRes = null, ipRes = null, siteRes = null;
    if (email) {
      if (!recaptchaToken) {
        setError('Please complete the reCAPTCHA.');
        setLoading(false);
        return;
      }
      tasks.push(
        fetch('/api/check-breach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, recaptchaToken }),
        }).then(r => r.json()).then(data => { hibpRes = data; })
      );
    }
    if (domain) {
      tasks.push(
        fetch('/api/whois-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain }),
        }).then(r => r.json()).then(data => { whoisRes = data; })
      );
      tasks.push(
        fetch('/api/site-security-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain, debug }),
        }).then(r => r.json()).then(data => { siteRes = data; })
      );
    }
    if (ip) {
      tasks.push(
        fetch('/api/ip-reputation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip }),
        }).then(r => r.json()).then(data => { ipRes = data; })
      );
    }
    if (!email && !domain && !ip) {
      setError('Please enter at least one field.');
      setLoading(false);
      return;
    }
    try {
      await Promise.all(tasks);
      setResult({ hibp: hibpRes, whois: whoisRes, ipReputation: ipRes, siteSecurity: siteRes });
      const newItem: UnifiedScanHistoryItem = {
        email,
        domain,
        ip,
        timestamp: new Date().toLocaleString(),
        result: { hibp: hibpRes, whois: whoisRes, ipReputation: ipRes, siteSecurity: siteRes },
      };
      setHistory([newItem, ...history].slice(0, 10));
    } catch (err) {
      setError('Failed to perform one or more scans.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('unifiedOsintHistory');
  };

  return (
    <Layout>
      <Head>
        <title>BreachSignal OSINT Toolbox</title>
        <meta name="description" content="Unified dashboard for WHOIS, IP Reputation, Website Security, and Email Breach Scans." />
      </Head>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">BreachSignal OSINT Toolbox</h1>
        <div className="mb-4 flex items-center gap-4">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-primary'} font-semibold`}>Scan All</button>
          <button onClick={() => setActiveTab('whois')} className={`px-4 py-2 rounded ${activeTab === 'whois' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-primary'} font-semibold`}>WHOIS</button>
          <button onClick={() => setActiveTab('ip')} className={`px-4 py-2 rounded ${activeTab === 'ip' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-primary'} font-semibold`}>IP Reputation</button>
          <button onClick={() => setActiveTab('site')} className={`px-4 py-2 rounded ${activeTab === 'site' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-primary'} font-semibold`}>Site Security</button>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 ml-4">
            <input type="checkbox" checked={debug} onChange={() => setDebug(!debug)} />
            Debug mode
          </label>
        </div>
        {activeTab === 'all' && (
          <form onSubmit={handleScanAll} className="mb-8">
            <div className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address (for breach check)"
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter domain (for WHOIS/Site Security)"
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="Enter IP address (for IP Reputation)"
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              {email && (
                <div className="flex justify-center">
                  <ReCAPTCHA
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
                    onChange={(token: string | null) => setRecaptchaToken(token)}
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading || (!!email && !recaptchaToken)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Scanning...' : 'Scan All'}
              </button>
            </div>
          </form>
        )}
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md dark:bg-red-900 dark:text-red-100">{error}</div>
        )}
        {result && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Scan Results</h2>
            {result.hibp && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300 mb-2">Email Breach Check</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto text-xs">{JSON.stringify(result.hibp, null, 2)}</pre>
              </div>
            )}
            {result.whois && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300 mb-2">WHOIS Lookup</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto text-xs">{JSON.stringify(result.whois, null, 2)}</pre>
              </div>
            )}
            {result.ipReputation && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300 mb-2">IP Reputation</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto text-xs">{JSON.stringify(result.ipReputation, null, 2)}</pre>
              </div>
            )}
            {result.siteSecurity && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300 mb-2">Site Security Scan</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto text-xs">{JSON.stringify(result.siteSecurity, null, 2)}</pre>
              </div>
            )}
            {result.errors && debug && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-red-700 dark:text-red-300 mb-2">Errors</h3>
                <pre className="bg-gray-100 dark:bg-gray-900 rounded p-2 overflow-x-auto text-xs text-red-700 dark:text-red-300">{JSON.stringify(result.errors, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
        {/* History Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Unified Scan History</h2>
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
            <div className="text-gray-500 dark:text-gray-400">No scans yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((item, idx) => (
                <li key={idx} className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-blue-700 dark:text-blue-300">{[item.email, item.domain, item.ip].filter(Boolean).join(' | ')}</span>
                    <span className="text-xs text-gray-500 ml-2">{item.timestamp}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
} 