import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { Resend } from 'resend';
import Airtable from 'airtable';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Airtable
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.AIRTABLE_BASE_ID || '');

interface BreachCheckRequest {
  email: string;
  name?: string;
  company?: string;
  recaptchaToken: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, name, company, recaptchaToken }: BreachCheckRequest = req.body;

    // Debug: Log Airtable config (no secrets)
    console.log('[Airtable Debug]', {
      AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
      TABLE: 'Leads',
      // Do NOT log API key
    });

    // Verify reCAPTCHA
    const recaptchaResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    );

    if (!recaptchaResponse.data.success) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }

    // Check HaveIBeenPwned API
    const hibpResponse = await axios.get(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        headers: {
          'hibp-api-key': process.env.HIBP_API_KEY,
          'user-agent': 'BreachSignal.io',
        },
      }
    );
    console.log('[HIBP API Response]', hibpResponse.data);

    const breaches = hibpResponse.data || [];
    const breachCount = breaches.length;

    // Log to Airtable
    try {
      await base('Leads').create([
        {
          fields: {
            Email: email,
            Name: name || '',
            Company: company || '',
            'Breach Count': breachCount,
            'Breach Details': JSON.stringify(breaches),
            Timestamp: new Date().toISOString(),
          },
        },
      ]);
    } catch (airtableError: any) {
      console.error('[Airtable Error]', {
        statusCode: airtableError.statusCode,
        message: airtableError.message,
        error: airtableError.error,
        baseId: process.env.AIRTABLE_BASE_ID,
        table: 'Leads',
      });
      return res.status(500).json({
        message: 'Airtable error: ' + (airtableError.message || 'Unknown error'),
        details: airtableError,
      });
    }

    // Send email
    const COMPANY_NAME = 'BreachSignal.io';
    const TAGLINE = 'Your Early Warning System for Digital Threats.';
    const CONTACT_EMAIL = 'info@BreachSignal.io';
    const CONTACT_PHONE = '(555) 123-4567';
    const CONTACT_ADDRESS = '1234 Security Ave, Suite 100, Cyber City, USA';
    const WEBSITE = 'www.breachsignal.io';
    const LOGO_URL = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/logo.png`;
    const calendlyUrl = process.env.NEXT_PUBLIC_BOOKING_URL;
    const pdfLink = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/`;
    const emailTemplate = `
      <div style="max-width:600px;margin:0 auto;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;background:#fff;border-radius:12px;padding:32px 24px;box-shadow:0 10px 20px rgba(0,0,0,0.08);">
        <div style="display:flex;align-items:center;margin-bottom:16px;">
          <img src="${LOGO_URL}" alt="BreachSignal.io Logo" style="height:48px;width:48px;margin-right:16px;border-radius:8px;" />
          <div>
            <div style="font-size:1.5rem;font-weight:bold;color:#083a5d;">${COMPANY_NAME}</div>
            <div style="font-size:1rem;color:#0ea5e9;">${TAGLINE}</div>
            <div style="font-size:0.9rem;color:#222;margin-top:2px;">${CONTACT_EMAIL} | ${CONTACT_PHONE} | ${CONTACT_ADDRESS} | ${WEBSITE}</div>
          </div>
        </div>
        <hr style="border:0;border-top:1.5px solid #0ea5e9;margin:16px 0;" />
        <h2 style="color:#083a5d;margin-bottom:0.5em;">Your Breach Check Results</h2>
        <p style="font-size:1.1rem;">Hello ${name || 'there'},</p>
        <p>We've completed your breach check for <b>${email}</b>.</p>
        ${breachCount > 0
          ? `
            <div style="margin:18px 0 10px 0;font-weight:bold;color:#0ea5e9;">We found ${breachCount} breach${breachCount > 1 ? 'es' : ''} associated with your email:</div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
              <thead>
                <tr style="background:#f1f5f9;color:#083a5d;font-size:1rem;">
                  <th style="padding:8px 4px;text-align:left;">Breach</th>
                  <th style="padding:8px 4px;text-align:left;">Date</th>
                  <th style="padding:8px 4px;text-align:left;">Domain</th>
                </tr>
              </thead>
              <tbody>
                ${breaches.map((breach: any) => `
                  <tr style="border-bottom:1px solid #e5e7eb;">
                    <td style="padding:6px 4px;font-weight:bold;">${breach.Title || breach.Name}</td>
                    <td style="padding:6px 4px;">${breach.BreachDate || 'Unknown'}</td>
                    <td style="padding:6px 4px;">${breach.Domain || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `
          : '<p style="color:#16a34a;font-weight:bold;">Good news! No breaches were found for your email address.</p>'
        }
        <div style="margin:18px 0 10px 0;">
          <a href="${pdfLink}" style="display:inline-block;padding:10px 20px;background:#083a5d;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;margin-right:12px;">Download PDF Report</a>
          <a href="${calendlyUrl}" style="display:inline-block;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:4px;font-weight:bold;">***** Book a Security Audit *****</a>
        </div>
        <hr style="border:0;border-top:1.5px solid #0ea5e9;margin:24px 0 12px 0;" />
        <div style="font-size:0.95rem;color:#0ea5e9;text-align:center;">${TAGLINE}</div>
        <div style="font-size:0.85rem;color:#222;text-align:center;margin-top:2px;">${COMPANY_NAME} | ${CONTACT_EMAIL} | ${CONTACT_PHONE} | ${CONTACT_ADDRESS} | ${WEBSITE}</div>
      </div>
    `;

    await resend.emails.send({
      from: 'BreachSignal.io <noreply@breachsignal.io>',
      to: email,
      subject: 'Your Breach Check Results',
      html: emailTemplate,
    });

    return res.status(200).json({
      success: true,
      breachCount,
      breaches,
    });
  } catch (error) {
    console.error('Error checking breach:', error);
    return res.status(500).json({
      message: 'An error occurred while checking for breaches',
    });
  }
} 