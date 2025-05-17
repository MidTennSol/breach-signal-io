import { useState } from 'react';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';
import copy from 'copy-to-clipboard';
import jsPDF from 'jspdf';

const ReCAPTCHA = dynamic(
  () => import('react-google-recaptcha'),
  { ssr: false }
) as typeof import('react-google-recaptcha');

interface FormData {
  email: string;
  name?: string;
  company?: string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    company: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | { breachCount: number; breaches: any[] }>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/check-breach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setSuccess({ breachCount: data.breachCount, breaches: data.breaches });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSuccess(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format the full report as plain text
  const formatReport = () => {
    if (!success || !success.breaches) return '';
    return success.breaches.map((breach: any) => {
      const title = `${breach.Title || breach.Name} (${breach.BreachDate || 'Unknown'}) – ${breach.Name}`;
      const domain = breach.Domain ? `  Domain: ${breach.Domain}` : '';
      const exposed = breach.DataClasses && breach.DataClasses.length > 0 ? `  Exposed data: ${breach.DataClasses.join(', ')}` : '';
      const desc = breach.Description ? `  Description: ${breach.Description.replace(/<[^>]+>/g, '')}` : '';
      return [title, domain, exposed, desc].filter(Boolean).join('\n');
    }).join('\n\n');
  };

  // Helper to format the report as HTML for PDF
  const formatReportHtml = () => {
    if (!success || !success.breaches) return '';
    return success.breaches.map((breach: any) => {
      const title = `<b>${breach.Title || breach.Name} (${breach.BreachDate || 'Unknown'}) – ${breach.Name}</b>`;
      const domain = breach.Domain ? `<div><b>Domain:</b> ${breach.Domain}</div>` : '';
      const exposed = breach.DataClasses && breach.DataClasses.length > 0 ? `<div><b>Exposed data:</b> ${breach.DataClasses.join(', ')}</div>` : '';
      const desc = breach.Description ? `<div><b>Description:</b> ${breach.Description}</div>` : '';
      return [title, domain, exposed, desc].filter(Boolean).join('');
    }).join('<br/><br/>');
  };

  const handleCopyReport = () => {
    copy(formatReport());
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(formatReport(), 10, 10, { maxWidth: 190 });
    doc.save('breach-report.pdf');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {!success && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Check Your Email for Data Breaches
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your email address to check if it has been compromised in any known data breaches.
            </p>
          </div>
        )}

        {success && (
          <div className={`rounded-md p-4 mb-6 ${success.breachCount > 0 ? 'bg-highlight/10 border border-highlight text-highlight' : 'bg-accent/10 border border-accent text-primary'}`}>
            {success.breachCount > 0 ? (
              <>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleCopyReport}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
                  >
                    Copy Report
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm font-medium"
                  >
                    Download PDF
                  </button>
                </div>
                <h3 className="font-bold text-lg mb-2">We found {success.breachCount} breach{success.breachCount > 1 ? 'es' : ''} for your email:</h3>
                <ul className="space-y-6">
                  {success.breaches.map((breach: any, idx: number) => {
                    const badgeFields = [
                      { key: 'IsVerified', label: 'Verified' },
                      { key: 'IsFabricated', label: 'Fabricated' },
                      { key: 'IsSensitive', label: 'Sensitive' },
                      { key: 'IsRetired', label: 'Retired' },
                      { key: 'IsSpamList', label: 'Spam List' },
                      { key: 'IsMalware', label: 'Malware' },
                      { key: 'IsSubscriptionFree', label: 'Subscription Free' },
                      { key: 'IsStealerLog', label: 'Stealer Log' },
                    ];
                    return (
                      <li key={idx} className="mb-6 border-b pb-4">
                        <div className="flex items-center gap-3 mb-1">
                          {breach.LogoPath && (
                            <img src={breach.LogoPath} alt={breach.Title || breach.Name} className="h-8 w-8 rounded bg-white border" />
                          )}
                          <div className="font-semibold text-base">
                            {breach.Title || breach.Name}
                            {breach.BreachDate && (
                              <span className="text-xs text-gray-500 ml-2">({new Date(breach.BreachDate).toLocaleDateString()})</span>
                            )}
                            {breach.Domain && (
                              <span className="text-xs text-gray-500 ml-2">– {breach.Domain}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          {breach.Domain && <div><b>Domain:</b> {breach.Domain}</div>}
                          {breach.BreachDate && <div><b>Breach date:</b> {new Date(breach.BreachDate).toLocaleDateString()}</div>}
                          {breach.AddedDate && <div><b>Added to HIBP:</b> {new Date(breach.AddedDate).toLocaleDateString()}</div>}
                          {breach.ModifiedDate && <div><b>Last modified:</b> {new Date(breach.ModifiedDate).toLocaleDateString()}</div>}
                          {breach.PwnCount && <div><b>Accounts affected:</b> {breach.PwnCount.toLocaleString()}</div>}
                          {breach.DataClasses && breach.DataClasses.length > 0 && (
                            <div><b>Exposed data:</b> {breach.DataClasses.join(', ')}</div>
                          )}
                          {breach.Description && (
                            <div className="text-sm mb-1" dangerouslySetInnerHTML={{ __html: `<b>Description:</b> ${breach.Description}` }} />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs">
                          {badgeFields.map(({ key, label }) =>
                            key in breach ? (
                              <span key={key} className={`px-2 py-0.5 rounded ${breach[key] ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{label}: {breach[key] ? 'Yes' : 'No'}</span>
                            ) : null
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <h3 className="font-bold text-lg">Good news! No breaches were found for your email address.</h3>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Company (Optional)
            </label>
            <input
              type="text"
              id="company"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div>
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
              onChange={(token: string | null) => setRecaptchaToken(token)}
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Checking...' : 'Check for Breaches'}
          </button>
        </form>
      </div>
    </Layout>
  );
} 