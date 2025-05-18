import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY;
const ABUSEIPDB_API_URL = 'https://api.abuseipdb.com/api/v2/check';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ip } = req.body;

  if (!ip) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  try {
    const response = await axios.get(ABUSEIPDB_API_URL, {
      params: {
        ipAddress: ip,
        maxAgeInDays: 90,
      },
      headers: {
        Key: ABUSEIPDB_API_KEY,
        Accept: 'application/json',
      },
    });

    const data = response.data.data;
    const result = {
      abuseConfidenceScore: data.abuseConfidenceScore,
      lastReportedAt: data.lastReportedAt,
      totalReports: data.totalReports,
      countryCode: data.countryCode,
      isp: data.isp,
      domain: data.domain,
      usageType: data.usageType,
      hostnames: data.hostnames,
    };
    return res.status(200).json(result);
  } catch (error) {
    console.error('IP Reputation error:', error);
    return res.status(500).json({
      error: 'Failed to fetch IP reputation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 