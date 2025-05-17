import { useState } from 'react';
import Layout from '../components/Layout';
import ReCAPTCHA from 'react-google-recaptcha';

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
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | { breachCount: number; breaches: any[] }>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recaptchaValue) {
      setError('Please complete the reCAPTCHA verification');
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
          recaptchaToken: recaptchaValue,
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
                <h3 className="font-bold text-lg mb-2">We found {success.breachCount} breach{success.breachCount > 1 ? 'es' : ''} for your email:</h3>
                <ul className="space-y-6">
                  {success.breaches.map((breach: any, idx: number) => (
                    <li key={idx} className="mb-6">
                      <div className="flex items-center gap-3 mb-1">
                        {breach.LogoPath && (
                          <img src={breach.LogoPath} alt={breach.Title || breach.Name} className="h-8 w-8 rounded bg-white border" />
                        )}
                        <div className="font-semibold text-base">{breach.Title || breach.Name} <span className="text-xs text-gray-500">{breach.Domain && `(${breach.Domain})`}</span></div>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">Breach date: {breach.BreachDate ? new Date(breach.BreachDate).toLocaleDateString() : 'Unknown'}</div>
                      <div className="text-xs text-gray-500 mb-1">Added to HIBP: {breach.AddedDate ? new Date(breach.AddedDate).toLocaleDateString() : 'Unknown'}</div>
                      <div className="text-xs text-gray-500 mb-1">Last modified: {breach.ModifiedDate ? new Date(breach.ModifiedDate).toLocaleDateString() : 'Unknown'}</div>
                      <div className="text-xs text-gray-500 mb-1">Accounts affected: {breach.PwnCount ? breach.PwnCount.toLocaleString() : 'Unknown'}</div>
                      {breach.Description && (
                        <div className="text-sm mb-1" dangerouslySetInnerHTML={{ __html: breach.Description }} />
                      )}
                      {breach.DataClasses && breach.DataClasses.length > 0 && (
                        <div className="text-xs mb-1">Exposed data: {breach.DataClasses.join(', ')}</div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1 text-xs">
                        <span className="bg-gray-200 px-2 py-0.5 rounded">Verified: {breach.IsVerified ? 'Yes' : 'No'}</span>
                        <span className="bg-gray-200 px-2 py-0.5 rounded">Sensitive: {breach.IsSensitive ? 'Yes' : 'No'}</span>
                        <span className="bg-gray-200 px-2 py-0.5 rounded">Spam List: {breach.IsSpamList ? 'Yes' : 'No'}</span>
                        <span className="bg-gray-200 px-2 py-0.5 rounded">Fabricated: {breach.IsFabricated ? 'Yes' : 'No'}</span>
                        <span className="bg-gray-200 px-2 py-0.5 rounded">Retired: {breach.IsRetired ? 'Yes' : 'No'}</span>
                      </div>
                    </li>
                  ))}
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

          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
              onChange={(value) => setRecaptchaValue(value)}
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