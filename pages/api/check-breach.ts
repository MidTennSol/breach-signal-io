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
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`,
      {
        headers: {
          'hibp-api-key': process.env.HIBP_API_KEY,
          'user-agent': 'BreachSignal.io',
        },
      }
    );

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
    const emailTemplate = `
      <h1>Your Breach Check Results</h1>
      <p>Hello ${name || 'there'},</p>
      <p>We've completed your breach check for ${email}.</p>
      ${breachCount > 0
        ? `
          <p>We found ${breachCount} breaches associated with your email:</p>
          <ul>
            ${breaches.map((breach: any) => `
              <li>${breach.Name} (${breach.BreachDate})</li>
            `).join('')}
          </ul>
        `
        : '<p>Good news! No breaches were found for your email address.</p>'
      }
      <p>Would you like to learn more about protecting your data?</p>
      <a href="${process.env.NEXT_PUBLIC_BOOKING_URL}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #0ea5e9;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin-top: 16px;
      ">
        Book a Security Audit
      </a>
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