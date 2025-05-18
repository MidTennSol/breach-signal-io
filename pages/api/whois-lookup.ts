import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const WHOIS_API_KEY = process.env.WHOIS_API_KEY;
const WHOIS_API_URL = 'https://www.whoisxmlapi.com/whoisserver/WhoisService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  try {
    const response = await axios.get(WHOIS_API_URL, {
      params: {
        apiKey: WHOIS_API_KEY,
        domainName: domain,
        outputFormat: 'JSON'
      }
    });

    const data = response.data;
    
    // Extract relevant information
    const whoisData = {
      registrar: data.WhoisRecord?.registrar?.name || 'Unknown',
      createdDate: data.WhoisRecord?.createdDate || 'Unknown',
      expiresDate: data.WhoisRecord?.expiresDate || 'Unknown',
      updatedDate: data.WhoisRecord?.updatedDate || 'Unknown',
      nameServers: data.WhoisRecord?.nameServers?.hostNames || [],
      status: data.WhoisRecord?.status || 'Unknown',
      rawData: data.WhoisRecord?.rawText || ''
    };

    return res.status(200).json(whoisData);
  } catch (error) {
    console.error('WHOIS lookup error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch WHOIS data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 