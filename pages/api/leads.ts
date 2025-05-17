import { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

// Initialize Airtable
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.AIRTABLE_BASE_ID || '');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const records = await base('Leads')
      .select({
        sort: [{ field: 'Timestamp', direction: 'desc' }],
      })
      .all();

    const leads = records.map((record) => {
      let breachDetailsRaw = record.get('Breach Details');
      let breachDetails: any[] = [];
      if (typeof breachDetailsRaw === 'string') {
        try {
          breachDetails = JSON.parse(breachDetailsRaw);
          if (!Array.isArray(breachDetails)) breachDetails = [];
        } catch {
          breachDetails = [];
        }
      }
      return {
        id: record.id,
        email: record.get('Email'),
        name: record.get('Name'),
        company: record.get('Company'),
        breachCount: record.get('Breach Count'),
        breachDetails,
        timestamp: record.get('Timestamp'),
      };
    });

    return res.status(200).json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching leads',
    });
  }
} 