import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Airtable from 'airtable';

interface Lead {
  id: string;
  email: string;
  name: string;
  company: string;
  breachCount: number;
  breachDetails: any[];
  timestamp: string;
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/leads');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch leads');
        }

        setLeads(data.leads);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  useEffect(() => {
    setFilteredLeads(
      leads.filter(
        (lead) =>
          (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
          (lead.name && lead.name.toLowerCase().includes(search.toLowerCase())) ||
          (lead.company && lead.company.toLowerCase().includes(search.toLowerCase()))
      )
    );
  }, [search, leads]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="sm:flex sm:items-center mb-4">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Leads Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              A list of all leads who have checked their email for breaches.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-4">
            <input
              type="text"
              placeholder="Search by email, name, or company..."
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading leads...</p>
          </div>
        ) : error ? (
          <div className="mt-8 text-center text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : (
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Company
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Breach Count
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                          Breach Preview
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                            {lead.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {lead.name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {lead.company || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {lead.breachCount}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(lead.timestamp).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 dark:text-gray-200 max-w-xs">
                            {lead.breachDetails && lead.breachDetails.length > 0 ? (
                              <ul className="list-disc ml-4">
                                {(expanded[lead.id] ? lead.breachDetails : lead.breachDetails.slice(0, 2)).map((breach: any, idx: number) => (
                                  <li key={idx}>
                                    <span className="font-semibold">{breach.Title || breach.Name}</span>
                                    {breach.BreachDate ? ` (${new Date(breach.BreachDate).toLocaleDateString()})` : ''}
                                  </li>
                                ))}
                                {lead.breachDetails.length > 2 && !expanded[lead.id] && (
                                  <li>
                                    <button
                                      className="text-primary underline cursor-pointer focus:outline-none"
                                      onClick={() => setExpanded((prev) => ({ ...prev, [lead.id]: true }))}
                                    >
                                      +{lead.breachDetails.length - 2} more...
                                    </button>
                                  </li>
                                )}
                                {lead.breachDetails.length > 2 && expanded[lead.id] && (
                                  <li>
                                    <button
                                      className="text-primary underline cursor-pointer focus:outline-none"
                                      onClick={() => setExpanded((prev) => ({ ...prev, [lead.id]: false }))}
                                    >
                                      Show less
                                    </button>
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <span className="italic text-gray-400">No breaches</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 