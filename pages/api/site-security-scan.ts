import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import dns from 'dns/promises';

const SSLLABS_API_URL = 'https://api.ssllabs.com/api/v3/analyze';
const SECURITY_HEADERS_API_URL = 'https://securityheaders.com/';

async function getSPF(domain: string) {
  try {
    const records = await dns.resolveTxt(`_spf.${domain}`);
    return records.flat().join(' ');
  } catch {
    return null;
  }
}

async function getDKIM(domain: string) {
  try {
    const records = await dns.resolveTxt(`default._domainkey.${domain}`);
    return records.flat().join(' ');
  } catch {
    return null;
  }
}

async function getDMARC(domain: string) {
  try {
    const records = await dns.resolveTxt(`_dmarc.${domain}`);
    return records.flat().join(' ');
  } catch {
    return null;
  }
}

async function getDNSSEC(domain: string) {
  try {
    const records = await dns.resolve(domain, 'DNSKEY');
    return records.length > 0;
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain, debug } = req.body;
  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  const errors: Record<string, any> = {};
  let sslData = null, secHeadersData = null, spf = null, dkim = null, dmarc = null, dnssec = null;

  try {
    try {
      const sslRes = await axios.get(SSLLABS_API_URL, { params: { host: domain } });
      sslData = sslRes.data;
    } catch (e) {
      errors.sslLabs = e instanceof Error ? e.message : e;
    }
    try {
      const secHeadersRes = await axios.get(SECURITY_HEADERS_API_URL, {
        params: {
          q: domain,
          followRedirects: 'on',
          hide: 'on',
          format: 'json',
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      secHeadersData = secHeadersRes.data;
    } catch (e) {
      errors.securityHeaders = e instanceof Error ? e.message : e;
    }
    try { spf = await getSPF(domain); } catch (e) { errors.spf = e instanceof Error ? e.message : e; }
    try { dkim = await getDKIM(domain); } catch (e) { errors.dkim = e instanceof Error ? e.message : e; }
    try { dmarc = await getDMARC(domain); } catch (e) { errors.dmarc = e instanceof Error ? e.message : e; }
    try { dnssec = await getDNSSEC(domain); } catch (e) { errors.dnssec = e instanceof Error ? e.message : e; }

    if (sslData && secHeadersData) {
      return res.status(200).json({
        sslLabs: sslData,
        securityHeaders: secHeadersData,
        dns: { spf, dkim, dmarc, dnssec },
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      });
    } else {
      const failMsg = `Scan failed for: ${[!sslData && 'SSL Labs', !secHeadersData && 'Security Headers'].filter(Boolean).join(', ')}`;
      if (debug) {
        return res.status(500).json({ error: failMsg, details: errors });
      } else {
        return res.status(500).json({ error: failMsg });
      }
    }
  } catch (error) {
    console.error('Site Security Scan error:', error);
    res.status(500).json({
      error: 'Failed to perform site security scan',
      details: debug ? (error instanceof Error ? error.message : error) : undefined,
    });
  }

  // Always return whatever results we have, plus errors if any
  return res.status(Object.keys(errors).length > 0 ? 207 : 200).json({
    sslLabs: sslData,
    securityHeaders: secHeadersData,
    dns: { spf, dkim, dmarc, dnssec },
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  });
} 